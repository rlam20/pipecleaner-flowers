-- Keep deployed projects in sync if the Zelle-only migration was already applied.
update public.cookie_store_settings
set venmo_handle = null,
    zelle_recipient = '757-333-2559'
where id = true;
