import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { CreateCookieOrderInput, OrderReceipt } from '../lib/types'

const migration = readFileSync(new URL('../supabase/migrations/202609250001_cookie_storefront.sql', import.meta.url), 'utf8')
const leadTimeMigration = readFileSync(new URL('../supabase/migrations/202610040001_two_day_pickup_lead.sql', import.meta.url), 'utf8')
const specialPickupMigration = readFileSync(new URL('../supabase/migrations/202610040002_oct_9_pickup_only.sql', import.meta.url), 'utf8')
const octoberMenuMigration = readFileSync(new URL('../supabase/migrations/202610150001_october_menu.sql', import.meta.url), 'utf8')
const fulfillmentMigration = readFileSync(new URL('../supabase/migrations/202610150002_next_week_fulfillment.sql', import.meta.url), 'utf8')
const seed = readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8')
type RpcResult = { success: boolean; code?: string; error?: string; created?: boolean; receipt?: OrderReceipt }
let db: PGlite
let pickupDate: string

function input(): CreateCookieOrderInput {
  return {
    request_id: crypto.randomUUID(),
    items: [{ product_id: 'spindle-and-spice', quantity: 4 }],
    packaging: 'standard', card_message: '',
    customer: { first_name: 'Test', last_name: 'Customer', phone: '+44 20 7946 0958', email: '', social_handle: '' },
    pickup_date: pickupDate, pickup_time: '12:30', pickup_window_id: 'oct-21-lawn-tabling', payment_method: 'venmo',
    expected_prices: [{ product_id: 'spindle-and-spice', unit_price_cents: 300 }],
    expected_pickup: { time_zone: 'America/New_York', pickup_location: null, start_time: '12:30', end_time: '15:30', slot_minutes: 30 },
    expected_payment_recipient: 'juzaoi',
  }
}

async function submit(payload: unknown): Promise<RpcResult> {
  const { rows } = await db.query<{ result: RpcResult }>('select public.submit_cookie_order($1::jsonb) as result', [JSON.stringify(payload)])
  return rows[0].result
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec('create role anon nologin; create role authenticated nologin;')
  await db.exec(migration)
  await db.exec(leadTimeMigration)
  await db.exec(seed)
  await db.exec(specialPickupMigration)
  await db.exec(specialPickupMigration)
  await db.exec(octoberMenuMigration)
  await db.exec(fulfillmentMigration)
}, 60_000)

beforeEach(async () => {
  await db.exec(`
    reset role;
    truncate public.cookie_orders;
    update public.cookie_products set active = true, unit_price_cents = 300;
    update public.cookie_store_settings set time_zone = 'America/New_York', pickup_location = null,
      venmo_handle = 'juzaoi', zelle_recipient = null;
    update public.cookie_pickup_windows set active = (id in ('oct-21-lawn-tabling', 'oct-23-pickup', 'oct-23-delivery', 'oct-24-delivery'));
  `)
  pickupDate = '2026-10-21'
})

afterAll(async () => { await db?.close() })

describe('cookie order database contract', () => {
  it('prices an order from the catalog, derives the 6/7 boundary, and returns no customer fields', async () => {
    const snack = await submit({ ...input(), total_cents: 1, order_type: 'party' })
    expect(snack).toMatchObject({ success: true, created: true, receipt: { total_cents: 1100, order_type: 'snack', status: 'awaiting_payment' } })
    expect(snack.receipt).not.toHaveProperty('customer')
    expect(snack.receipt).not.toHaveProperty('customer_phone')
    expect(snack.receipt?.order_number).toMatch(/^DND-\d{8}-[A-F0-9]{12}$/)
    const party = input()
    party.items = [
      { product_id: 'spindle-and-spice', quantity: 4 },
      { product_id: 'draculas-kiss', quantity: 3 },
    ]
    party.expected_prices.push({ product_id: 'draculas-kiss', unit_price_cents: 300 })
    party.packaging = 'card'
    party.card_message = 'Enjoy <these> & celebrate!'
    expect(await submit(party)).toMatchObject({ success: true, receipt: { total_cents: 1900, order_type: 'party', card_message: party.card_message } })
  })

  it('persists fulfillment, contact, payment, card, and immutable item snapshots', async () => {
    const payload = input()
    payload.customer.email = 'test@example.test'
    payload.customer.social_handle = 'TikTok: @test.customer'
    payload.packaging = 'card'
    payload.card_message = 'A little treat.'
    expect((await submit(payload)).success).toBe(true)
    const { rows } = await db.query<Record<string, unknown>>('select * from public.cookie_orders where request_id = $1', [payload.request_id])
    expect(rows[0]).toMatchObject({
      customer_first_name: 'Test', customer_last_name: 'Customer', customer_phone: payload.customer.phone,
      customer_email: payload.customer.email, customer_social_handle: payload.customer.social_handle,
      pickup_window_id: 'oct-21-lawn-tabling', pickup_time: '12:30:00', time_zone: 'America/New_York',
      card_message: 'A little treat.', payment_method: 'venmo', payment_recipient: 'juzaoi', status: 'awaiting_payment',
    })
    expect(rows[0].items).toEqual([{ product_id: 'spindle-and-spice', name: 'Spindle and Spice', quantity: 4, unit_price_cents: 300, line_total_cents: 1200 }])
  })

  it.each([[3, 800], [4, 1100]])('saves the authoritative %i-cookie total', async (quantity, total) => {
    const payload = input()
    payload.items[0].quantity = quantity
    expect(await submit(payload)).toMatchObject({ success: true, receipt: { total_cents: total } })
    const { rows } = await db.query<{ total_cents: number; receipt: OrderReceipt }>('select total_cents, receipt from public.cookie_orders where request_id = $1', [payload.request_id])
    expect(rows[0].total_cents).toBe(total)
    expect(rows[0].receipt.total_cents).toBe(total)
  })

  it('applies five-cookie groups before remaining three-cookie groups', async () => {
    const payload = input()
    payload.items = [
      { product_id: 'spindle-and-spice', quantity: 4 },
      { product_id: 'draculas-kiss', quantity: 4 },
    ]
    payload.expected_prices.push({ product_id: 'draculas-kiss', unit_price_cents: 300 })
    expect(await submit(payload)).toMatchObject({ success: true, receipt: { total_cents: 2100 } })
  })

  it('multiplies the five-cookie discount for a valid ten-cookie order', async () => {
    const payload = input()
    payload.items = [
      { product_id: 'spindle-and-spice', quantity: 4 },
      { product_id: 'draculas-kiss', quantity: 4 },
      { product_id: 'coraline-cheesecake', quantity: 2 },
    ]
    payload.expected_prices.push(
      { product_id: 'draculas-kiss', unit_price_cents: 300 },
      { product_id: 'coraline-cheesecake', unit_price_cents: 300 },
    )
    expect(await submit(payload)).toMatchObject({ success: true, receipt: { total_cents: 2600 } })
  })

  it('rejects more than four per flavor and more than ten total', async () => {
    const overFlavor = input()
    overFlavor.items[0].quantity = 5
    expect(await submit(overFlavor)).toMatchObject({ success: false, code: 'validation' })
    const payload = input()
    payload.items = [
      { product_id: 'spindle-and-spice', quantity: 4 },
      { product_id: 'draculas-kiss', quantity: 4 },
      { product_id: 'coraline-cheesecake', quantity: 3 },
    ]
    payload.expected_prices.push(
      { product_id: 'draculas-kiss', unit_price_cents: 300 },
      { product_id: 'coraline-cheesecake', unit_price_cents: 300 },
    )
    expect(await submit(payload)).toMatchObject({ success: false, code: 'validation' })
  })

  it('makes retries idempotent even after catalog changes and rejects token reuse for a different payload', async () => {
    const payload = input()
    const original = await submit(payload)
    await db.exec("update public.cookie_products set unit_price_cents = 900 where id = 'spindle-and-spice'")
    const retry = await submit(payload)
    expect(retry).toEqual({ success: true, created: false, receipt: original.receipt })
    payload.customer.first_name = 'Different'
    expect(await submit(payload)).toMatchObject({ success: false, code: 'validation' })
    const { rows } = await db.query<{ count: number }>('select count(*)::int as count from public.cookie_orders')
    expect(rows[0].count).toBe(1)
  })

  it('serializes multiple submissions of the same token to one receipt', async () => {
    const payload = input()
    const results = await Promise.all(Array.from({ length: 5 }, () => submit(payload)))
    expect(results.filter((result) => result.created)).toHaveLength(1)
    expect(new Set(results.map((result) => result.receipt?.order_number)).size).toBe(1)
  })

  it.each([0, -1, 1.5, '2', 5, 2147483648, 99999999999])('rejects invalid quantity %s in direct RPC calls', async (quantity) => {
    const payload = input()
    expect(await submit({ ...payload, items: [{ product_id: 'spindle-and-spice', quantity }] })).toMatchObject({ success: false, code: 'validation' })
  })

  it.each([null, [], {}, { items: [] }])('rejects malformed payload %# without a SQL exception', async (payload) => {
    expect(await submit(payload)).toMatchObject({ success: false, code: 'validation' })
  })

  it('rejects duplicate products and requires an expected price for each line', async () => {
    const payload = input()
    payload.items.push({ ...payload.items[0] })
    payload.expected_prices.push({ ...payload.expected_prices[0] })
    expect(await submit(payload)).toMatchObject({ success: false, code: 'validation' })
    expect(await submit({ ...input(), expected_prices: [] })).toMatchObject({ success: false, code: 'validation' })
  })

  it.each([
    ['first_name', ''], ['last_name', ' '.repeat(5)], ['phone', '123'],
    ['phone', '555-CALL-NOW'], ['email', 'not-an-email'], ['social_handle', 'x'.repeat(101)],
  ])('validates customer %s', async (field, value) => {
    const payload = input()
    expect(await submit({ ...payload, customer: { ...payload.customer, [field]: value } })).toMatchObject({ success: false, code: 'validation' })
  })

  it('requires a nonblank card message, caps its length, and clears a standard-package note', async () => {
    expect(await submit({ ...input(), packaging: 'card', card_message: '  ' })).toMatchObject({ success: false, code: 'validation' })
    expect(await submit({ ...input(), packaging: 'card', card_message: 'x'.repeat(501) })).toMatchObject({ success: false, code: 'validation' })
    expect(await submit({ ...input(), card_message: 'A previous card draft' })).toMatchObject({ success: true, receipt: { card_message: '' } })
  })

  it('accepts October 21 and rejects dates outside the two fulfillment days', async () => {
    expect((await submit(input())).success).toBe(true)
    expect(await submit({ ...input(), pickup_date: '2026-10-22' })).toMatchObject({ success: false, code: 'validation' })
  })

  it('accepts the Friday delivery window', async () => {
    const payload = input()
    payload.pickup_date = '2026-10-23'
    payload.pickup_time = '18:00'
    payload.pickup_window_id = 'oct-23-delivery'
    payload.expected_pickup = { ...payload.expected_pickup, start_time: '18:00', end_time: '19:30' }
    expect(await submit(payload)).toMatchObject({ success: true, receipt: { pickup_date: '2026-10-23', pickup_time: '18:00', fulfillment_method: 'delivery' } })
  })

  it('accepts the Friday pickup and Saturday delivery windows', async () => {
    const friday = input()
    friday.pickup_date = '2026-10-23'
    friday.pickup_time = '15:30'
    friday.pickup_window_id = 'oct-23-pickup'
    friday.expected_pickup = { ...friday.expected_pickup, start_time: '15:30', end_time: '19:30' }
    expect(await submit(friday)).toMatchObject({ success: true, receipt: { fulfillment_method: 'pickup' } })

    const saturday = input()
    saturday.pickup_date = '2026-10-24'
    saturday.pickup_time = '09:00'
    saturday.pickup_window_id = 'oct-24-delivery'
    saturday.expected_pickup = { ...saturday.expected_pickup, start_time: '09:00', end_time: '14:30' }
    expect(await submit(saturday)).toMatchObject({ success: true, receipt: { pickup_date: '2026-10-24', fulfillment_method: 'delivery' } })
  })

  it.each(['12:15', '15:30', '25:00', '12:30:30'])('rejects unavailable or invalid pickup time %s', async (pickup_time) => {
    expect(await submit({ ...input(), pickup_time })).toMatchObject({ success: false, code: 'validation' })
  })

  it('rejects calendar overflow, wrong weekdays, and missing windows', async () => {
    expect(await submit({ ...input(), pickup_date: '2099-02-30' })).toMatchObject({ success: false, code: 'validation' })
    const { rows } = await db.query<{ date: string }>("select to_char($1::date + 1, 'YYYY-MM-DD') as date", [pickupDate])
    expect(await submit({ ...input(), pickup_date: rows[0].date })).toMatchObject({ success: false, code: 'validation' })
    expect(await submit({ ...input(), pickup_window_id: 'gone' })).toMatchObject({ success: false, code: 'changed' })
  })

  it('returns changed for edited prices and unavailable products', async () => {
    await db.exec("update public.cookie_products set unit_price_cents = 500 where id = 'spindle-and-spice'")
    expect(await submit(input())).toMatchObject({ success: false, code: 'changed' })
    await db.exec("update public.cookie_products set unit_price_cents = 300, active = false where id = 'spindle-and-spice'")
    expect(await submit(input())).toMatchObject({ success: false, code: 'changed' })
  })

  it.each([
    ['time_zone', 'UTC'], ['pickup_location', 'A new pickup spot'],
    ['start_time', '15:00'], ['end_time', '19:00'], ['slot_minutes', 60],
  ])('returns changed when expected pickup %s differs', async (field, value) => {
    const payload = input()
    expect(await submit({ ...payload, expected_pickup: { ...payload.expected_pickup, [field]: value } })).toMatchObject({ success: false, code: 'changed' })
  })

  it('returns changed for payment recipient changes and prevents unconfigured Zelle', async () => {
    expect(await submit({ ...input(), expected_payment_recipient: 'someone-else' })).toMatchObject({ success: false, code: 'changed' })
    expect(await submit({ ...input(), payment_method: 'zelle', expected_payment_recipient: '' })).toMatchObject({ success: false, code: 'changed' })
    await db.exec("update public.cookie_store_settings set venmo_handle = 'updated-recipient'")
    expect(await submit(input())).toMatchObject({ success: false, code: 'changed' })
  })

  it('seed reruns preserve edited prices and store settings', async () => {
    await db.exec("update public.cookie_products set unit_price_cents = 750 where id = 'spindle-and-spice'; update public.cookie_store_settings set pickup_location = 'Edited pickup location'")
    await db.exec(seed)
    const products = await db.query<{ price: number }>("select unit_price_cents as price from public.cookie_products where id = 'spindle-and-spice'")
    const settings = await db.query<{ location: string }>('select pickup_location as location from public.cookie_store_settings')
    expect(products.rows[0].price).toBe(750)
    expect(settings.rows[0].location).toBe('Edited pickup location')
  })

  it.each(['anon', 'authenticated'])('%s can read active catalog and submit only through RPC', async (role) => {
    await db.exec("update public.cookie_products set active = false where id = 'coraline-cheesecake'")
    await db.exec(`set role ${role}`)
    try {
      const products = await db.query<{ id: string }>('select id from public.cookie_products')
      expect(products.rows.map((row) => row.id)).not.toContain('coraline-cheesecake')
      await expect(db.query('select * from public.cookie_orders')).rejects.toThrow(/permission denied/)
      await expect(db.query("update public.cookie_products set unit_price_cents = 1")).rejects.toThrow(/permission denied/)
      await expect(db.query("insert into public.cookie_orders(request_id) values(gen_random_uuid())")).rejects.toThrow(/permission denied/)
      expect(await submit(input())).toMatchObject({ success: true, created: true })
    } finally {
      await db.exec('reset role')
    }
  })
})
