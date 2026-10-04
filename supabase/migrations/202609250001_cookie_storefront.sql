-- Additive migration: existing flower tables and order history are left intact.
begin;

create table if not exists public.cookie_products (
  id text primary key,
  name text not null check (length(btrim(name)) between 1 and 120),
  description text not null default '',
  image_url text not null,
  unit_price_cents integer not null check (unit_price_cents > 0),
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.cookie_store_settings (
  id boolean primary key default true check (id),
  time_zone text not null default 'America/New_York',
  pickup_location text,
  venmo_handle text,
  zelle_recipient text,
  instagram_url text
);

create table if not exists public.cookie_pickup_windows (
  id text primary key,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time(0) without time zone not null,
  end_time time(0) without time zone not null,
  slot_minutes integer not null default 30 check (slot_minutes between 1 and 1440),
  active boolean not null default true,
  check (end_time > start_time),
  check (extract(second from start_time) = 0 and extract(second from end_time) = 0)
);

create table if not exists public.cookie_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  request_payload jsonb not null,
  order_number text not null unique,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_social_handle text,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  order_type text not null check (order_type in ('snack', 'party')),
  packaging text not null check (packaging in ('standard', 'card')),
  card_message text not null default '',
  total_cents bigint not null check (total_cents > 0 and total_cents <= 9007199254740991),
  pickup_date date not null,
  pickup_time time(0) without time zone not null,
  pickup_window_id text not null,
  pickup_location text,
  time_zone text not null,
  payment_method text not null check (payment_method in ('venmo', 'zelle')),
  payment_recipient text not null,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'in_progress', 'completed', 'cancelled')),
  receipt jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.cookie_products enable row level security;
alter table public.cookie_store_settings enable row level security;
alter table public.cookie_pickup_windows enable row level security;
alter table public.cookie_orders enable row level security;

revoke all on public.cookie_products, public.cookie_store_settings,
  public.cookie_pickup_windows, public.cookie_orders from public, anon, authenticated;
grant select on public.cookie_products, public.cookie_store_settings,
  public.cookie_pickup_windows to anon, authenticated;

create policy "Public active cookie catalog" on public.cookie_products
  for select to anon, authenticated using (active);
create policy "Public cookie store settings" on public.cookie_store_settings
  for select to anon, authenticated using (true);
create policy "Public active pickup windows" on public.cookie_pickup_windows
  for select to anon, authenticated using (active);
-- No public policies or grants on cookie_orders. Only the bounded RPC writes it.

create or replace function public.submit_cookie_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_existing public.cookie_orders%rowtype;
  v_settings public.cookie_store_settings%rowtype;
  v_window public.cookie_pickup_windows%rowtype;
  v_product public.cookie_products%rowtype;
  v_item jsonb;
  v_expected jsonb;
  v_items jsonb := '[]'::jsonb;
  v_seen text[] := '{}'::text[];
  v_product_id text;
  v_quantity bigint;
  v_quantity_total bigint := 0;
  v_total numeric := 0;
  v_first text;
  v_last text;
  v_phone text;
  v_email text;
  v_social text;
  v_packaging text;
  v_note text;
  v_payment text;
  v_recipient text;
  v_date date;
  v_time time;
  v_today date;
  v_number text;
  v_receipt jsonb;
  v_expected_start text;
  v_expected_end text;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please review your order and try again.');
  end if;
  if coalesce(payload->>'request_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please refresh your order and try again.');
  end if;
  v_request_id := (payload->>'request_id')::uuid;
  -- Serialize identical tokens, including requests that arrive before the first insert.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request_id::text, 0));
  select * into v_existing from public.cookie_orders where request_id = v_request_id;
  if found then
    if v_existing.request_payload <> payload then
      return jsonb_build_object('success', false, 'code', 'validation', 'error', 'This submission has already been used. Please review your order before submitting again.');
    end if;
    return jsonb_build_object('success', true, 'receipt', v_existing.receipt, 'created', false);
  end if;

  if jsonb_typeof(payload->'customer') is distinct from 'object'
    or jsonb_typeof(payload->'items') is distinct from 'array'
    or jsonb_typeof(payload->'expected_prices') is distinct from 'array'
    or jsonb_typeof(payload->'expected_pickup') is distinct from 'object' then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please complete your order details.');
  end if;
  if jsonb_array_length(payload->'items') = 0
    or jsonb_array_length(payload->'items') <> jsonb_array_length(payload->'expected_prices') then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please select at least one cookie and review its price.');
  end if;
  if jsonb_typeof(payload#>'{customer,first_name}') is distinct from 'string'
    or jsonb_typeof(payload#>'{customer,last_name}') is distinct from 'string'
    or jsonb_typeof(payload#>'{customer,phone}') is distinct from 'string'
    or jsonb_typeof(payload#>'{customer,email}') is distinct from 'string'
    or jsonb_typeof(payload#>'{customer,social_handle}') is distinct from 'string' then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please complete your contact details.');
  end if;
  v_first := btrim(payload#>>'{customer,first_name}');
  v_last := btrim(payload#>>'{customer,last_name}');
  v_phone := btrim(payload#>>'{customer,phone}');
  v_email := btrim(payload#>>'{customer,email}');
  v_social := btrim(payload#>>'{customer,social_handle}');
  if length(v_first) not between 1 and 80 or length(v_last) not between 1 and 80
    or length(v_phone) > 40
    or v_phone !~ '^\+?[0-9().[:space:]-]+$'
    or length(regexp_replace(v_phone, '[^0-9]', '', 'g')) not between 7 and 15 then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Enter your first name, last name, and a valid phone number.');
  end if;
  if length(v_email) > 254 or (v_email <> '' and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Enter a valid email address or leave it blank.');
  end if;
  if length(v_social) > 100 then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Enter a valid social media handle or leave it blank.');
  end if;
  v_packaging := payload->>'packaging';
  v_note := btrim(coalesce(payload->>'card_message', ''));
  if v_packaging is null or v_packaging not in ('standard', 'card')
    or jsonb_typeof(payload->'card_message') is distinct from 'string'
    or length(v_note) > 500 or (v_packaging = 'card' and v_note = '') then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Choose packaging and include a message of up to 500 characters for your card.');
  end if;
  if v_packaging = 'standard' then v_note := ''; end if;

  select * into v_settings from public.cookie_store_settings where id = true;
  if not found or not exists (select 1 from pg_catalog.pg_timezone_names where name = v_settings.time_zone) then
    return jsonb_build_object('success', false, 'code', 'unavailable', 'error', 'Ordering is temporarily unavailable. Please try again later.');
  end if;
  v_today := (current_timestamp at time zone v_settings.time_zone)::date;
  v_payment := payload->>'payment_method';
  if v_payment is null or v_payment not in ('venmo', 'zelle') then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Choose an available payment method.');
  end if;
  v_recipient := nullif(btrim(case when v_payment = 'venmo' then v_settings.venmo_handle else v_settings.zelle_recipient end), '');
  if v_recipient is null or v_recipient is distinct from payload->>'expected_payment_recipient' then
    return jsonb_build_object('success', false, 'code', 'changed', 'error', 'Payment details have changed. Please review them before submitting.');
  end if;

  if coalesce(payload->>'pickup_date', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or coalesce(payload->>'pickup_time', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Choose a valid pickup date and time.');
  end if;
  begin
    v_date := (payload->>'pickup_date')::date;
    v_time := (payload->>'pickup_time')::time;
  exception when datetime_field_overflow or invalid_datetime_format then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Choose a valid pickup date and time.');
  end;
  if v_date < v_today + 5 then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please allow at least five calendar days before pickup.');
  end if;
  select * into v_window from public.cookie_pickup_windows
    where id = payload->>'pickup_window_id' and active;
  if not found then
    return jsonb_build_object('success', false, 'code', 'changed', 'error', 'That pickup time is no longer available. Please select another.');
  end if;
  v_expected_start := payload#>>'{expected_pickup,start_time}';
  v_expected_end := payload#>>'{expected_pickup,end_time}';
  if v_settings.time_zone is distinct from payload#>>'{expected_pickup,time_zone}'
    or v_settings.pickup_location is distinct from payload#>>'{expected_pickup,pickup_location}'
    or left(v_window.start_time::text, 5) is distinct from v_expected_start
    or left(v_window.end_time::text, 5) is distinct from v_expected_end
    or to_jsonb(v_window.slot_minutes) is distinct from payload#>'{expected_pickup,slot_minutes}' then
    return jsonb_build_object('success', false, 'code', 'changed', 'error', 'Pickup details have changed. Please review your date and time.');
  end if;
  if extract(dow from v_date)::integer <> v_window.day_of_week
    or v_time < v_window.start_time or v_time >= v_window.end_time
    or mod(extract(epoch from (v_time - v_window.start_time))::numeric, (v_window.slot_minutes * 60)::numeric) <> 0 then
    return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Choose an available time for your pickup date.');
  end if;

  for v_item in select value from jsonb_array_elements(payload->'items') loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or jsonb_typeof(v_item->'product_id') is distinct from 'string'
      or jsonb_typeof(v_item->'quantity') is distinct from 'number'
      or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]*$'
      or length(v_item->>'quantity') > 10 then
      return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Cookie quantities must be positive whole numbers.');
    end if;
    v_product_id := v_item->>'product_id';
    v_quantity := (v_item->>'quantity')::bigint;
    if v_quantity > 2147483647 or v_product_id = any(v_seen) then
      return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please review your cookie quantities.');
    end if;
    v_seen := array_append(v_seen, v_product_id);
    if (select count(*) from jsonb_array_elements(payload->'expected_prices') e where e->>'product_id' = v_product_id) <> 1 then
      return jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please review the price of each selected cookie.');
    end if;
    select value into v_expected from jsonb_array_elements(payload->'expected_prices')
      where value->>'product_id' = v_product_id;
    select * into v_product from public.cookie_products where id = v_product_id and active;
    if not found or to_jsonb(v_product.unit_price_cents) is distinct from v_expected->'unit_price_cents' then
      return jsonb_build_object('success', false, 'code', 'changed', 'error', 'The cookie menu or prices have changed. Please review your order.');
    end if;
    v_total := v_total + v_product.unit_price_cents::numeric * v_quantity;
    v_quantity_total := v_quantity_total + v_quantity;
    if v_total > 9007199254740991 then
      return jsonb_build_object('success', false, 'code', 'validation', 'error', 'This order is too large to process online.');
    end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id, 'name', v_product.name, 'quantity', v_quantity,
      'unit_price_cents', v_product.unit_price_cents,
      'line_total_cents', v_product.unit_price_cents::bigint * v_quantity
    ));
  end loop;

  v_number := 'DND-' || to_char(v_today, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_receipt := jsonb_build_object(
    'order_number', v_number, 'order_date', v_today::text, 'items', v_items,
    'order_type', case when v_quantity_total <= 6 then 'snack' else 'party' end,
    'packaging', v_packaging, 'card_message', v_note, 'total_cents', v_total::bigint,
    'pickup_date', v_date::text, 'pickup_time', left(v_time::text, 5),
    'pickup_location', v_settings.pickup_location, 'time_zone', v_settings.time_zone,
    'payment_method', v_payment, 'payment_recipient', v_recipient, 'status', 'awaiting_payment'
  );
  insert into public.cookie_orders (
    request_id, request_payload, order_number,
    customer_first_name, customer_last_name, customer_phone, customer_email, customer_social_handle,
    items, order_type, packaging, card_message, total_cents,
    pickup_date, pickup_time, pickup_window_id, pickup_location, time_zone,
    payment_method, payment_recipient, receipt
  ) values (
    v_request_id, payload, v_number,
    v_first, v_last, v_phone, nullif(v_email, ''), nullif(v_social, ''),
    v_items, v_receipt->>'order_type', v_packaging, v_note, v_total::bigint,
    v_date, v_time, v_window.id, v_settings.pickup_location, v_settings.time_zone,
    v_payment, v_recipient, v_receipt
  );
  return jsonb_build_object('success', true, 'receipt', v_receipt, 'created', true);
end;
$$;

revoke all on function public.submit_cookie_order(jsonb) from public, anon, authenticated;
grant execute on function public.submit_cookie_order(jsonb) to anon, authenticated;

commit;
