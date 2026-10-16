-- Replaces the active storefront catalog with the October menu while preserving retired products and order history.
begin;

update public.cookie_products set active = false;

insert into public.cookie_products
  (id, name, description, image_url, unit_price_cents, sort_order, active)
values
  ('spindle-and-spice', 'Spindle and Spice', 'A soft cinnamon-butter cookie swirled with gooey cinnamon filling, topped with vanilla glaze and a spooky marshmallow spiderweb.', '/cookies/spindle-and-spice.png', 300, 1, true),
  ('draculas-kiss', 'Dracula''s Kiss', 'A rich chocolate cookie with a blood-red raspberry center and chocolate drizzle. Love at first bite.', '/cookies/draculas-kiss.png', 300, 2, true),
  ('coraline-cheesecake', 'Coraline Cheesecake', 'A dark chocolate cookie with a creamy cheesecake center, ube purple drizzle, and golden stars.', '/cookies/coraline-cheesecake.png', 300, 3, true),
  ('mummys-favorite', 'Mummy''s Favorite', 'A warm chai-spiced Biscoff cookie loaded with white chocolate chips and wrapped in a mummy-inspired white chocolate drizzle.', '/cookies/mummys-favorite.png', 300, 4, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  unit_price_cents = excluded.unit_price_cents,
  sort_order = excluded.sort_order,
  active = true;

commit;
