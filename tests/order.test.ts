import { describe, expect, it } from 'vitest'
import { earliestPickupDate, orderCategory, orderLines, orderTotal, pickupSlots, selectionErrors, validateDraft } from '../lib/order'
import type { OrderDraft, StorefrontData } from '../lib/types'

const data: StorefrontData = {
  available: true,
  products: [
    { id: 'matcha', name: 'Matcha', description: '', image_url: '', unit_price_cents: 400, sort_order: 1, active: true },
    { id: 'mango', name: 'Mango', description: '', image_url: '', unit_price_cents: 500, sort_order: 2, active: true },
  ],
  settings: { time_zone: 'America/New_York', pickup_location: null, venmo_handle: 'juzaoi', zelle_recipient: null, instagram_url: null },
  windows: [{ id: 'oct-9-2026', day_of_week: 5, start_time: '11:00', end_time: '17:30', slot_minutes: 30, active: true }],
}

function draft(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    items: [{ product_id: 'matcha', quantity: 1 }], packaging: 'standard', card_message: '',
    customer: { first_name: 'Ray', last_name: 'Customer', phone: '(555) 123-4567', email: '', social_handle: '' },
    pickup_date: '2026-10-09', pickup_time: '11:00', pickup_window_id: 'oct-9-2026', payment_method: 'venmo', request_id: crypto.randomUUID(),
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

  it('applies the trio and five-cookie deal only at their exact quantities', () => {
    const priced = (quantity: number) => orderTotal(orderLines([{ product_id: 'matcha', quantity }], data.products))
    expect(priced(2)).toBe(800)
    expect(priced(3)).toBe(800)
    expect(priced(4)).toBe(1600)
    expect(priced(5)).toBe(1300)
    expect(priced(6)).toBe(2400)
  })

  it('creates start-inclusive, end-exclusive pickup slots', () => {
    expect(pickupSlots('2026-10-09', data.windows).map(slot => slot.time)).toEqual([
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
    ])
    expect(pickupSlots('2026-10-16', data.windows)).toEqual([])
  })

  it('adds two local calendar days across month and daylight-saving boundaries', () => {
    expect(earliestPickupDate('America/New_York', new Date('2025-12-31T23:00:00Z'))).toBe('2026-01-02')
    expect(earliestPickupDate('America/New_York', new Date('2026-03-07T05:30:00Z'))).toBe('2026-03-09')
  })

  it('requires a card message and leaves standard packaging free', () => {
    expect(selectionErrors(draft({ packaging: 'card' }), data)).toHaveProperty('card_message')
    expect(selectionErrors(draft(), data)).not.toHaveProperty('card_message')
  })

  it('validates required contact, payment, lead time, and exact pickup slot', () => {
    expect(validateDraft(draft(), data)).toEqual({})
    const errors = validateDraft(draft({ customer: { first_name: '', last_name: '', phone: '123', email: 'bad', social_handle: '' }, pickup_time: '11:15' }), data)
    expect(errors).toMatchObject({ first_name: expect.any(String), last_name: expect.any(String), phone: expect.any(String), email: expect.any(String), pickup_time: expect.any(String) })
  })
})
