-- Temporarily restrict ordering to Friday, October 9, 2026, from 11 a.m. to 5 p.m.
begin;

update public.cookie_pickup_windows set active = false;

insert into public.cookie_pickup_windows
  (id, day_of_week, start_time, end_time, slot_minutes, active)
values
  ('oct-9-2026', 5, '11:00', '17:00', 30, true)
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

  return public.submit_cookie_order_with_standard_availability(payload);
end;
$$;

revoke all on function public.submit_cookie_order_with_standard_availability(jsonb)
  from public, anon, authenticated;
revoke all on function public.submit_cookie_order(jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_cookie_order(jsonb)
  to anon, authenticated;

commit;
