-- Adds the two fall fundraiser flavors without changing existing product edits.
begin;

insert into public.cookie_products
  (id, name, description, image_url, unit_price_cents, sort_order, active)
values
  ('pumpkin-cheesecake', 'Pumpkin Cheesecake', 'Warm pumpkin spice wrapped around a rich, creamy cheesecake center.', '/cookies/pumpkin-cheesecake-v2.png', 300, 4, true),
  ('banana-bread-snickerdoodle', 'Banana Bread Snickerdoodle', 'Cozy banana bread flavor rolled in the cinnamon-sugar warmth of a snickerdoodle.', '/cookies/banana-bread-snickerdoodle-v2.png', 300, 5, true)
on conflict (id) do update set image_url = excluded.image_url;

commit;
