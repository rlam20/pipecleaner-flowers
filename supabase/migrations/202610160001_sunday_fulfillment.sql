-- Replace Saturday fulfillment with Sunday delivery and pickup windows.
begin;

update public.cookie_pickup_windows
set active = false
where id = 'oct-24-delivery';

insert into public.cookie_pickup_windows
  (id, day_of_week, start_time, end_time, slot_minutes, active)
values
  ('oct-25-delivery', 0, '09:00', '14:30', 30, true),
  ('oct-25-pickup', 0, '14:00', '19:30', 30, true)
on conflict (id) do update set
  day_of_week = excluded.day_of_week,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  slot_minutes = excluded.slot_minutes,
  active = true;

create or replace function public.submit_cookie_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_submission jsonb;
  v_quantity integer;
  v_deal_total integer;
  v_actual_date text;
  v_synthetic_date text;
  v_method text;
begin
  if payload is null or pg_catalog.jsonb_typeof(payload) <> 'object' then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please review your order and try again.');
  end if;

  if (current_timestamp at time zone 'America/New_York') > timestamp '2026-10-20 20:00:00' then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'unavailable', 'error', 'Preorders closed Tuesday, October 20 at 8:00 PM.');
  end if;

  v_actual_date := payload->>'pickup_date';
  v_synthetic_date := case v_actual_date
    when '2026-10-21' then '2099-01-07'
    when '2026-10-23' then '2099-01-02'
    when '2026-10-25' then '2099-01-04'
    else null
  end;
  if v_synthetic_date is null then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'validation', 'error', 'Choose Wednesday, October 21, Friday, October 23, or Sunday, October 25.');
  end if;
  v_method := case when payload->>'pickup_window_id' like '%delivery%' then 'delivery' else 'pickup' end;

  v_submission := pg_catalog.jsonb_set(payload, '{pickup_date}', pg_catalog.to_jsonb(v_synthetic_date));
  v_result := public.submit_cookie_order_with_standard_availability(v_submission);

  if coalesce((v_result->>'success')::boolean, false)
    and coalesce((v_result->>'created')::boolean, false) then
    select coalesce(sum((item->>'quantity')::integer), 0)
      into v_quantity
      from pg_catalog.jsonb_array_elements(payload->'items') as selected(item);

    if exists (
      select 1 from pg_catalog.jsonb_array_elements(payload->'items') as selected(item)
      where (item->>'quantity')::integer > 4
    ) then
      delete from public.cookie_orders where request_id = (payload->>'request_id')::uuid;
      return pg_catalog.jsonb_build_object('success', false, 'code', 'validation', 'error', 'Each flavor is limited to 4 cookies. Need more? DM @doughnotdisturb_jz on Instagram.');
    end if;

    if v_quantity > 10 then
      delete from public.cookie_orders where request_id = (payload->>'request_id')::uuid;
      return pg_catalog.jsonb_build_object('success', false, 'code', 'validation', 'error', 'Orders are limited to 10 cookies. Need more? DM @doughnotdisturb_jz on Instagram.');
    end if;

    v_deal_total := ((v_result#>>'{receipt,total_cents}')::integer
      - ((v_quantity / 5) * 200)
      - (((v_quantity % 5) / 3) * 100));

    update public.cookie_orders
    set pickup_date = v_actual_date::date,
        total_cents = v_deal_total,
        receipt = pg_catalog.jsonb_set(
          pg_catalog.jsonb_set(
            pg_catalog.jsonb_set(receipt, '{pickup_date}', pg_catalog.to_jsonb(v_actual_date)),
            '{total_cents}', pg_catalog.to_jsonb(v_deal_total)
          ),
          '{fulfillment_method}', pg_catalog.to_jsonb(v_method)
        )
    where request_id = (payload->>'request_id')::uuid
    returning pg_catalog.jsonb_build_object('success', true, 'receipt', receipt, 'created', true)
      into v_result;
  end if;

  return v_result;
end;
$$;

revoke all on function public.submit_cookie_order(jsonb) from public, anon, authenticated;
grant execute on function public.submit_cookie_order(jsonb) to anon, authenticated;

commit;
