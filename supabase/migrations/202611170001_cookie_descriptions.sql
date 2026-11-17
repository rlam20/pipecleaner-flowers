-- Update product copy without changing prices or remaining inventory.
begin;

update public.cookie_products
set description = 'Red apple cider cookie studded with buttery stroopwafel pieces and topped with a caramel-filled stroopwafel heart.'
where id = 'far-from-the-tree';

update public.cookie_products
set description = 'Warmly spiced chai cookie infused with espresso, packed with white and milk chocolate chips, buttery toffee chunks, and finished with flaky sea salt.'
where id = 'dirty-little-secret';

update public.cookie_products
set description = 'Rich brown butter chocolate chip cookie with savory miso for the perfect balance of sweet, salty, and nutty flavors.'
where id = 'miso-happy';

commit;
