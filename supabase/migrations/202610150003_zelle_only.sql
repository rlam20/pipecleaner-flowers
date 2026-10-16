-- Switch current checkout payments from Venmo to Zelle.
update public.cookie_store_settings
set venmo_handle = null,
    zelle_recipient = '757-333-2559'
where id = true;
