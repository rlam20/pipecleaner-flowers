-- October 23 is delivery-only, with selectable half-hour times from 3:30 through 6:00 p.m.
begin;

update public.cookie_pickup_windows
set active = false
where id = 'oct-23-pickup';

insert into public.cookie_pickup_windows
  (id, day_of_week, start_time, end_time, slot_minutes, active)
values
  ('oct-23-delivery', 5, '15:30', '18:30', 30, true)
on conflict (id) do update set
  day_of_week = excluded.day_of_week,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  slot_minutes = excluded.slot_minutes,
  active = true;

commit;
