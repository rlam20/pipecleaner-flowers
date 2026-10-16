-- Switches the storefront to the varied photoshoot image set.
begin;

update public.cookie_products
set image_url = case id
  when 'matcha-neapolitan' then '/cookies/matcha-v3.png'
  when 'biscoff-chai' then '/cookies/biscoff-v3.png'
  when 'mango-lassi' then '/cookies/mango-v3.png'
  when 'pumpkin-cheesecake' then '/cookies/pumpkin-cheesecake-v3.png'
  when 'banana-bread-snickerdoodle' then '/cookies/banana-bread-snickerdoodle-v4.png'
  else image_url
end
where id in (
  'matcha-neapolitan',
  'biscoff-chai',
  'mango-lassi',
  'pumpkin-cheesecake',
  'banana-bread-snickerdoodle'
);

commit;
