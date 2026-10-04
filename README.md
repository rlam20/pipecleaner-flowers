# DoughNotDisturb

A two-page cookie ordering storefront built with Next.js, TypeScript, Tailwind CSS, Supabase, and Resend.

## Local setup

1. Install packages with `npm install`.
2. Apply `supabase/migrations/202609250001_cookie_storefront.sql` in the Supabase SQL editor.
3. Apply `supabase/seed.sql` once to add the three sample products, placeholder prices, Venmo recipient, and sample pickup hours.
4. Configure the environment variables below and run `npm run dev`.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
BUSINESS_EMAIL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Next.js loads these values from `.env.local` during local development. The Supabase publishable/default key is preferred; the anon key remains a backward-compatible fallback. Keep `.env.local` private and configure the same variables in the hosting provider for production.

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is retained for compatibility with the previous application but is not used by the current pickup-only storefront. The redesign does not load Google Maps or expose delivery/address controls.

The migration is additive: it does not delete or alter the previous flower tables or historical orders. Public clients may read the active cookie catalog and pickup configuration, but they cannot read or write cookie orders directly. The `submit_cookie_order` database function validates and prices each order before saving it.

## Change storefront content

Use the Supabase table editor:

- `cookie_products`: product names, descriptions, active status, image paths, sort order, and prices in integer cents. The seeded `$4.00` prices are placeholders.
- `cookie_store_settings`: time zone, pickup location, Venmo/Zelle recipients, and optional Instagram URL. Venmo is seeded as `juzaoi`; Zelle stays hidden until configured.
- `cookie_pickup_windows`: recurring hours by weekday (`0` Sunday through `6` Saturday), start/end times, and slot duration. Seeded hours are sample settings.
- `cookie_orders`: saved orders and their status. Prices, pickup details, and payment recipient are snapshotted at submission time.

The seed uses `on conflict do nothing`, so running it again will not overwrite later edits. Pickup dates require at least five calendar days of lead time in the configured business time zone. The end of a pickup window is exclusive.

## Images and design

Replace files in `public/cookies` while keeping their filenames, or update each product's `image_url` in Supabase. Exact generation prompts and asset notes are in `docs/image-prompts.md`.

Brand and semantic colors live at the top of `app/globals.css`. Global ordering state is saved in versioned `sessionStorage`, so selections and checkout details survive navigation and a refresh in the same tab. A successful order clears customer data and retains only the receipt for the inline confirmation.

## Email and payment

Orders are always committed before a notification is attempted. Email failures do not discard an order; Supabase remains authoritative. `RESEND_API_KEY` authenticates Resend and `BUSINESS_EMAIL` is used as both the notification destination and sender. That address must be permitted by your Resend account. You may optionally set `RESEND_FROM_EMAIL` to a separate verified sender identity.

Payment is manual. Checkout displays the configured Venmo or Zelle recipient and asks the customer to include the generated order number. New orders remain `awaiting_payment`; the site does not claim to verify payment.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite exercises UI-independent order rules and the real SQL migration in an embedded PostgreSQL-compatible database, including direct RPC validation, idempotent retries, RLS permissions, changing prices, pickup rules, and seed safety.
