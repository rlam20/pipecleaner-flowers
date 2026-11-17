import { describe, expect, it } from 'vitest'
import { earliestPickupDate, orderCategory, orderLines, orderTotal, pickupSlots, selectionErrors, validateDraft } from '../lib/order'
import type { OrderDraft, StorefrontData } from '../lib/types'

const data: StorefrontData = {
  available: true,
  products: [
    { id: 'matcha', name: 'Matcha', description: '', image_url: '', unit_price_cents: 400, sort_order: 1, active: true, stock_quantity: 31 },
    { id: 'mango', name: 'Mango', description: '', image_url: '', unit_price_cents: 500, sort_order: 2, active: true, stock_quantity: 31 },
  ],
  settings: { time_zone: 'America/New_York', pickup_location: null, venmo_handle: 'juzaoi', zelle_recipient: null, instagram_url: null },
  windows: [
    { id: 'nov-17-pickup', fulfillment_date: '2026-11-17', fulfillment_method: 'pickup', day_of_week: 2, start_time: '12:30', end_time: '14:30', slot_minutes: 30, active: true },
    { id: 'nov-21-delivery', fulfillment_date: '2026-11-21', fulfillment_method: 'delivery', day_of_week: 6, start_time: '09:00', end_time: '12:00', slot_minutes: 30, active: true },
  ],
}

function draft(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    items: [{ product_id: 'matcha', quantity: 1 }], packaging: 'standard', card_message: '', order_notes: '', delivery_details: '',
    customer: { first_name: 'Ray', last_name: 'Customer', phone: '(555) 123-4567', email: '', social_handle: '' },
    pickup_date: '2026-11-17', pickup_time: '12:30', pickup_window_id: 'nov-17-pickup', payment_method: 'venmo', request_id: crypto.randomUUID(),
    ...overrides,
  }
}

describe('cookie order helpers', () => {
  it('switches from Snack Pick Up to Party Pack at seven cookies', () => {
    expect(orderCategory(6)).toBe('snack')
    expect(orderCategory(7)).toBe('party')
  })

  it('uses current catalog prices for every line', () => {
    expect(orderLines([{ product_id: 'matcha', quantity: 2 }, { product_id: 'mango', quantity: 1 }], data.products)).toEqual([
      { product_id: 'matcha', name: 'Matcha', quantity: 2, unit_price_cents: 400, line_total_cents: 800 },
      { product_id: 'mango', name: 'Mango', quantity: 1, unit_price_cents: 500, line_total_cents: 500 },
    ])
  })

  it('applies five-cookie groups first, then three-cookie groups', () => {
    const priced = (quantity: number) => orderTotal(orderLines([{ product_id: 'matcha', quantity }], data.products))
    expect(priced(2)).toBe(700)
    expect(priced(3)).toBe(1000)
    expect(priced(4)).toBe(1400)
    expect(priced(5)).toBe(1700)
    expect(priced(6)).toBe(2000)
    expect(priced(8)).toBe(2700)
    expect(priced(10)).toBe(3400)
  })

  it('creates only complete slots for the exact date and method', () => {
    expect(pickupSlots('2026-11-17', data.windows).map(slot => slot.time)).toEqual(['12:30','13:00','13:30','14:00']);
    expect(pickupSlots('2026-11-21', data.windows)).toHaveLength(6);
    expect(pickupSlots('2026-11-18', data.windows)).toEqual([]);
  })

  it('adds one local calendar day across month and daylight-saving boundaries', () => {
    expect(earliestPickupDate('America/New_York', new Date('2025-12-31T23:00:00Z'))).toBe('2026-01-01')
    expect(earliestPickupDate('America/New_York', new Date('2026-03-07T05:30:00Z'))).toBe('2026-03-08')
  })

  it('requires a card message and leaves standard packaging free', () => {
    expect(selectionErrors(draft({ packaging: 'card' }), data)).toHaveProperty('card_message')
    expect(selectionErrors(draft(), data)).not.toHaveProperty('card_message')
  })

  it('limits optional order notes to 1,000 characters', () => {
    expect(selectionErrors(draft({ order_notes: 'Please call on arrival.' }), data)).not.toHaveProperty('order_notes')
    expect(selectionErrors(draft({ order_notes: 'x'.repeat(1001) }), data)).toHaveProperty('order_notes')
  })

  it('rejects quantities above available stock', () => {
    expect(selectionErrors(draft({ items: [{ product_id: 'matcha', quantity: 32 }] }), data)).toHaveProperty('order')
    expect(selectionErrors(draft({ items: [{ product_id: 'matcha', quantity: 32 }, { product_id: 'mango', quantity: 32 }] }), data)).toHaveProperty('order')
  })

  it('validates required contact, payment, lead time, and exact pickup slot', () => {
    const beforeCutoff = new Date('2026-11-17T04:59:00Z')
    expect(validateDraft(draft(), data, beforeCutoff)).toEqual({})
    const errors = validateDraft(draft({ customer: { first_name: '', last_name: '', phone: '123', email: 'bad', social_handle: '' }, pickup_time: '12:45' }), data, beforeCutoff)
    expect(errors).toMatchObject({ first_name: expect.any(String), last_name: expect.any(String), phone: expect.any(String), email: expect.any(String), pickup_time: expect.any(String) })
    expect(validateDraft(draft(), data, new Date('2026-11-17T05:00:01Z'))).toHaveProperty('pickup_date')
  })
})
