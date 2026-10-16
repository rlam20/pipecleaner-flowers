-- Editable starting data. Prices are samples, not a final menu.
-- Existing records are never overwritten when this seed is run again.
begin;

insert into public.cookie_products
  (id, name, description, image_url, unit_price_cents, sort_order)
values
  ('spindle-and-spice', 'Spindle and Spice', 'A soft cinnamon-butter cookie swirled with gooey cinnamon filling, topped with vanilla glaze and a spooky marshmallow spiderweb.', '/cookies/spindle-and-spice.png', 300, 1),
  ('draculas-kiss', 'Dracula''s Kiss', 'A rich chocolate cookie with a blood-red raspberry center and chocolate drizzle. Love at first bite.', '/cookies/draculas-kiss.png', 300, 2),
  ('coraline-cheesecake', 'Coraline Cheesecake', 'A dark chocolate cookie with a creamy cheesecake center, purple drizzle, and golden stars.', '/cookies/coraline-cheesecake.png', 300, 3),
  ('mummys-favorite', 'Mummy''s Favorite', 'A warm chai-spiced Biscoff cookie loaded with white chocolate chips and wrapped in a mummy-inspired white chocolate drizzle.', '/cookies/mummys-favorite.png', 300, 4)
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
