-- Connect the supplied product photos without changing inventory or prices.
begin;
update public.cookie_products set image_url = '/cookies/far%20from%20the%20tree.png' where id = 'far-from-the-tree';
update public.cookie_products set image_url = '/cookies/Dirty%20little%20secret.png' where id = 'dirty-little-secret';
update public.cookie_products set image_url = '/cookies/miso%20butter.png' where id = 'miso-happy';
update public.cookie_products set image_url = '/cookies/bueno_than_ever.png' where id = 'bueno-than-ever';
commit;
