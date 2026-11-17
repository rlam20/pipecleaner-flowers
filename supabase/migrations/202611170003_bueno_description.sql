-- Add Bueno Than Ever copy without changing prices or inventory.
update public.cookie_products
set description = 'A decadent cookie cake with fluffy whipped cream, rich Nutella, sweet jam, and cookie dough, topped with a Kinder Bueno and a fresh strawberry.'
where id = 'bueno-than-ever';
