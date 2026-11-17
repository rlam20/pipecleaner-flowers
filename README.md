# DoughNotDisturb

A two-page cookie ordering storefront built with Next.js, TypeScript, Tailwind CSS, Supabase, and Resend.

## Local setup

1. Install packages with `npm install`.
2. Apply the first SQL migration, then `supabase/seed.sql` to initialize store settings.
3. Apply the remaining SQL files in `supabase/migrations` in filename order using the Supabase SQL editor. Later migrations replace the sample menu and availability.
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

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is retained for compatibility but is not used. Delivery location and handoff details are collected as text.

The migration is additive: it does not delete or alter the previous flower tables or historical orders. Public clients may read the active cookie catalog and pickup configuration, but they cannot read or write cookie orders directly. The `submit_cookie_order` database function validates and prices each order before saving it.

## Change storefront content

Use the Supabase table editor:

- `cookie_products`: product names, descriptions, active status, image paths, sort order, prices in integer cents, and remaining `stock_quantity`.
- `cookie_store_settings`: time zone, pickup location, Zelle recipient, and optional Instagram URL. Zelle is configured as `757-333-2559`.
- `cookie_pickup_windows`: exact `fulfillment_date`, `fulfillment_method`, weekday, start/end times, and slot duration.
- `cookie_orders`: saved orders and their status. Prices, pickup details, and payment recipient are snapshotted at submission time.

Orders require one calendar day of advance notice in America/New_York: order by 11:59 PM the previous day. Each selected 30-minute slot must fit entirely within its window. Customers are told the exact handoff will be coordinated directly.

## November 2026 release

Apply `supabase/migrations/202611160001_november_stock_and_fulfillment.sql` once to the existing database before deploying this app version. It initializes Far From the Tree (2 × $4), Dirty Little Secret (6 × $4), Miso Happy (31 × $3), and Bueno Than Ever (27 × $4), and the November 17, 18, 20, and 21 schedule. Do not reset stock by replaying this migration after sales begin. No production database changes are performed by building the app.

Deals repeat: each group of three earns $2 off, and a remaining pair earns $1 off. Delivery adds $1 per order after discounts. Prices and fees are calculated by the database and snapshotted in receipts.

Submitting an order reserves inventory even while awaiting payment. Database row locks prevent overselling; retries reuse the existing order without another deduction. In the privileged Supabase table editor, changing an order's status to `cancelled` restores its reserved stock exactly once. Cancelled orders cannot be reopened; place a new order instead. Do not delete orders to cancel them. There is no automatic unpaid-order expiry.

The November menu uses text artwork until appropriate flavor images are supplied; add descriptions and image URLs to the product records when available.

## Images and design

Replace files in `public/cookies` while keeping their filenames, or update each product's `image_url` in Supabase. Exact generation prompts and asset notes are in `docs/image-prompts.md`.

Brand and semantic colors live at the top of `app/globals.css`. Global ordering state is saved in versioned `sessionStorage`, so selections and checkout details survive navigation and a refresh in the same tab. A successful order clears customer data and retains only the receipt for the inline confirmation.

## Email and payment

Orders are always committed before a notification is attempted. Email failures do not discard an order; Supabase remains authoritative. `RESEND_API_KEY` authenticates Resend and `BUSINESS_EMAIL` is the notification destination. By default, notifications are sent from `Dough Not Disturb <onboarding@resend.dev>`, which Resend limits to the email address associated with your Resend account. If the customer supplied an email address, it is set as `Reply-To` so replying to the notification addresses the customer.

For production sending to other recipients, verify a domain and set `RESEND_FROM_EMAIL` to a sender on that domain. This optional variable overrides the Resend testing sender.

Payment is manual. Checkout displays the configured Zelle recipient and asks the customer to include the generated order number. New orders remain `awaiting_payment`; the site does not claim to verify payment.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite exercises UI-independent order rules and the real SQL migration in an embedded PostgreSQL-compatible database, including direct RPC validation, idempotent retries, RLS permissions, changing prices, pickup rules, and seed safety.
