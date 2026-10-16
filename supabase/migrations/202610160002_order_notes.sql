-- Add optional customer notes while preserving the existing validated order function.
begin;

alter table public.cookie_orders
  add column if not exists order_notes text not null default ''
  check (length(order_notes) <= 1000);

do $$
begin
  if pg_catalog.to_regprocedure('public.submit_cookie_order_without_notes(jsonb)') is null then
    alter function public.submit_cookie_order_with_standard_availability(jsonb)
      rename to submit_cookie_order_without_notes;
  end if;
end;
$$;

create or replace function public.submit_cookie_order_with_standard_availability(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_notes text;
begin
  if payload is null or pg_catalog.jsonb_typeof(payload) <> 'object'
    or pg_catalog.jsonb_typeof(payload->'order_notes') is distinct from 'string' then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'validation', 'error', 'Please review your order notes and try again.');
  end if;

  v_notes := pg_catalog.btrim(payload->>'order_notes');
  if pg_catalog.length(v_notes) > 1000 then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'validation', 'error', 'Keep order notes under 1,000 characters.');
  end if;

  v_result := public.submit_cookie_order_without_notes(payload);

  if coalesce((v_result->>'success')::boolean, false)
    and coalesce((v_result->>'created')::boolean, false) then
    update public.cookie_orders
    set order_notes = v_notes,
        receipt = pg_catalog.jsonb_set(receipt, '{order_notes}', pg_catalog.to_jsonb(v_notes))
    where request_id = (payload->>'request_id')::uuid
    returning pg_catalog.jsonb_build_object('success', true, 'receipt', receipt, 'created', true)
      into v_result;
  end if;

  return v_result;
end;
$$;

revoke all on function public.submit_cookie_order_without_notes(jsonb)
  from public, anon, authenticated;
revoke all on function public.submit_cookie_order_with_standard_availability(jsonb)
  from public, anon, authenticated;

commit;
