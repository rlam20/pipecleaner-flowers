import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { CreateCookieOrderInput, OrderReceipt } from '../lib/types'

const migration = readFileSync(new URL('../supabase/migrations/202609250001_cookie_storefront.sql', import.meta.url), 'utf8')
const leadTimeMigration = readFileSync(new URL('../supabase/migrations/202610040001_two_day_pickup_lead.sql', import.meta.url), 'utf8')
const seed = readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8')
type RpcResult = { success: boolean; code?: string; error?: string; created?: boolean; receipt?: OrderReceipt }
let db: PGlite
let pickupDate: string

function input(): CreateCookieOrderInput {
  return {
    request_id: crypto.randomUUID(),
    items: [{ product_id: 'matcha-neapolitan', quantity: 6 }],
    packaging: 'standard', card_message: '',
    customer: { first_name: 'Test', last_name: 'Customer', phone: '+44 20 7946 0958', email: '', social_handle: '' },
    pickup_date: pickupDate, pickup_time: '16:00', pickup_window_id: 'test-pickup', payment_method: 'venmo',
    expected_prices: [{ product_id: 'matcha-neapolitan', unit_price_cents: 400 }],
    expected_pickup: { time_zone: 'America/New_York', pickup_location: null, start_time: '16:00', end_time: '18:00', slot_minutes: 30 },
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
}, 60_000)

beforeEach(async () => {
  await db.exec(`
    reset role;
    truncate public.cookie_orders;
    update public.cookie_products set active = true, unit_price_cents = 400;
    update public.cookie_store_settings set time_zone = 'America/New_York', pickup_location = null,
      venmo_handle = 'juzaoi', zelle_recipient = null;
    delete from public.cookie_pickup_windows where id = 'test-pickup';
    insert into public.cookie_pickup_windows(id,day_of_week,start_time,end_time,slot_minutes)
    values ('test-pickup', extract(dow from ((current_timestamp at time zone 'America/New_York')::date + 2)), '16:00', '18:00', 30);
  `)
  const { rows } = await db.query<{ date: string }>("select to_char((current_timestamp at time zone 'America/New_York')::date + 2, 'YYYY-MM-DD') as date")
  pickupDate = rows[0].date
})

afterAll(async () => { await db?.close() })

describe('cookie order database contract', () => {
  it('prices an order from the catalog, derives the 6/7 boundary, and returns no customer fields', async () => {
    const snack = await submit({ ...input(), total_cents: 1, order_type: 'party' })
    expect(snack).toMatchObject({ success: true, created: true, receipt: { total_cents: 2400, order_type: 'snack', status: 'awaiting_payment' } })
    expect(snack.receipt).not.toHaveProperty('customer')
    expect(snack.receipt).not.toHaveProperty('customer_phone')
    expect(snack.receipt?.order_number).toMatch(/^DND-\d{8}-[A-F0-9]{12}$/)
    const party = input()
    party.items[0].quantity = 7
    party.packaging = 'card'
    party.card_message = 'Enjoy <these> & celebrate!'
    expect(await submit(party)).toMatchObject({ success: true, receipt: { total_cents: 2800, order_type: 'party', card_message: party.card_message } })
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
      pickup_window_id: 'test-pickup', pickup_time: '16:00:00', time_zone: 'America/New_York',
      card_message: 'A little treat.', payment_method: 'venmo', payment_recipient: 'juzaoi', status: 'awaiting_payment',
    })
    expect(rows[0].items).toEqual([{ product_id: 'matcha-neapolitan', name: 'Matcha Neapolitan', quantity: 6, unit_price_cents: 400, line_total_cents: 2400 }])
  })

  it('makes retries idempotent even after catalog changes and rejects token reuse for a different payload', async () => {
    const payload = input()
    const original = await submit(payload)
    await db.exec("update public.cookie_products set unit_price_cents = 900 where id = 'matcha-neapolitan'")
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

  it.each([0, -1, 1.5, '2', 2147483648, 99999999999])('rejects invalid quantity %s in direct RPC calls', async (quantity) => {
    const payload = input()
    expect(await submit({ ...payload, items: [{ product_id: 'matcha-neapolitan', quantity }] })).toMatchObject({ success: false, code: 'validation' })
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

  it('accepts exactly two local calendar days and rejects a shorter lead time', async () => {
    expect((await submit(input())).success).toBe(true)
    const { rows } = await db.query<{ date: string }>("select to_char((current_timestamp at time zone 'America/New_York')::date + 1, 'YYYY-MM-DD') as date")
    expect(await submit({ ...input(), pickup_date: rows[0].date })).toMatchObject({ success: false, code: 'validation' })
  })

  it.each(['16:15', '18:00', '25:00', '16:00:30'])('rejects unavailable or invalid pickup time %s', async (pickup_time) => {
    expect(await submit({ ...input(), pickup_time })).toMatchObject({ success: false, code: 'validation' })
  })

  it('rejects calendar overflow, wrong weekdays, and missing windows', async () => {
    expect(await submit({ ...input(), pickup_date: '2099-02-30' })).toMatchObject({ success: false, code: 'validation' })
    const { rows } = await db.query<{ date: string }>("select to_char($1::date + 1, 'YYYY-MM-DD') as date", [pickupDate])
    expect(await submit({ ...input(), pickup_date: rows[0].date })).toMatchObject({ success: false, code: 'validation' })
    expect(await submit({ ...input(), pickup_window_id: 'gone' })).toMatchObject({ success: false, code: 'changed' })
  })

  it('returns changed for edited prices and unavailable products', async () => {
    await db.exec("update public.cookie_products set unit_price_cents = 500 where id = 'matcha-neapolitan'")
    expect(await submit(input())).toMatchObject({ success: false, code: 'changed' })
    await db.exec("update public.cookie_products set unit_price_cents = 400, active = false where id = 'matcha-neapolitan'")
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
    await db.exec("update public.cookie_products set unit_price_cents = 750 where id = 'matcha-neapolitan'; update public.cookie_store_settings set pickup_location = 'Edited pickup location'")
    await db.exec(seed)
    const products = await db.query<{ price: number }>("select unit_price_cents as price from public.cookie_products where id = 'matcha-neapolitan'")
    const settings = await db.query<{ location: string }>('select pickup_location as location from public.cookie_store_settings')
    expect(products.rows[0].price).toBe(750)
    expect(settings.rows[0].location).toBe('Edited pickup location')
  })

  it.each(['anon', 'authenticated'])('%s can read active catalog and submit only through RPC', async (role) => {
    await db.exec("update public.cookie_products set active = false where id = 'mango-lassi'")
    await db.exec(`set role ${role}`)
    try {
      const products = await db.query<{ id: string }>('select id from public.cookie_products')
      expect(products.rows.map((row) => row.id)).not.toContain('mango-lassi')
      await expect(db.query('select * from public.cookie_orders')).rejects.toThrow(/permission denied/)
      await expect(db.query("update public.cookie_products set unit_price_cents = 1")).rejects.toThrow(/permission denied/)
      await expect(db.query("insert into public.cookie_orders(request_id) values(gen_random_uuid())")).rejects.toThrow(/permission denied/)
      expect(await submit(input())).toMatchObject({ success: true, created: true })
    } finally {
      await db.exec('reset role')
    }
  })
})
