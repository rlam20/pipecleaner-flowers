-- Editable starting data. Prices are samples, not a final menu.
-- Existing records are never overwritten when this seed is run again.
begin;

insert into public.cookie_products
  (id, name, description, image_url, unit_price_cents, sort_order)
values
  ('matcha-neapolitan', 'Matcha Neapolitan', 'Three lovely layers. Earthy matcha, strawberry, and vanilla in one soft-baked cookie.', '/cookies/matcha.webp', 300, 1),
  ('biscoff-chai', 'Biscoff Chai', 'A little spice, a little crunch. Chai warmth meets caramelized Biscoff.', '/cookies/biscoff.webp', 300, 2),
  ('mango-lassi', 'Mango Lassi', 'A sunny little escape. Mango and creamy tang, inspired by a favorite sip.', '/cookies/mango.webp', 300, 3)
on conflict (id) do nothing;

insert into public.cookie_store_settings
  (id, time_zone, pickup_location, venmo_handle, zelle_recipient, instagram_url)
values (true, 'America/New_York', null, 'juzaoi', null, null)
on conflict (id) do nothing;

insert into public.cookie_pickup_windows
  (id, day_of_week, start_time, end_time, slot_minutes)
values
  ('oct-9-2026', 5, '11:00', '17:30', 30)
on conflict (id) do nothing;

commit;
