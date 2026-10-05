-- Temporarily restrict ordering to Friday, October 9, 2026, from 11 a.m. to 5 p.m.
begin;

update public.cookie_products
set unit_price_cents = 300
where id in ('matcha-neapolitan', 'biscoff-chai', 'mango-lassi');

update public.cookie_pickup_windows set active = false;

insert into public.cookie_pickup_windows
  (id, day_of_week, start_time, end_time, slot_minutes, active)
values
  ('oct-9-2026', 5, '11:00', '17:30', 30, true)
on conflict (id) do update set
  day_of_week = excluded.day_of_week,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  slot_minutes = excluded.slot_minutes,
  active = excluded.active;

do $$
begin
  if pg_catalog.to_regprocedure('public.submit_cookie_order_with_standard_availability(jsonb)') is null then
    alter function public.submit_cookie_order(jsonb)
      rename to submit_cookie_order_with_standard_availability;
  end if;
end;
$$;

create or replace function public.submit_cookie_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_quantity integer;
  v_deal_total integer;
begin
  if payload is null
    or pg_catalog.jsonb_typeof(payload) <> 'object'
    or coalesce(payload->>'pickup_date', '') <> '2026-10-09' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'validation',
      'error', 'Pickup is only available on Friday, October 9, 2026.'
    );
  end if;

  v_result := public.submit_cookie_order_with_standard_availability(payload);
  if coalesce((v_result->>'success')::boolean, false)
    and coalesce((v_result->>'created')::boolean, false) then
    select coalesce(sum((item->>'quantity')::integer), 0)
      into v_quantity
      from pg_catalog.jsonb_array_elements(payload->'items') as selected(item);
    v_deal_total := case v_quantity when 3 then 800 when 5 then 1300 else null end;
    if v_deal_total is not null then
      update public.cookie_orders
      set total_cents = v_deal_total,
          receipt = pg_catalog.jsonb_set(receipt, '{total_cents}', pg_catalog.to_jsonb(v_deal_total))
      where request_id = (payload->>'request_id')::uuid
      returning pg_catalog.jsonb_build_object(
        'success', true,
        'receipt', receipt,
        'created', true
      ) into v_result;
    end if;
  end if;
  return v_result;
end;
$$;

revoke all on function public.submit_cookie_order_with_standard_availability(jsonb)
  from public, anon, authenticated;
revoke all on function public.submit_cookie_order(jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_cookie_order(jsonb)
  to anon, authenticated;

commit;
