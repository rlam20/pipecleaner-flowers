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
  windows: [
    { id: 'oct-21-lawn-tabling', day_of_week: 3, start_time: '12:30', end_time: '15:30', slot_minutes: 30, active: true },
    { id: 'oct-23-pickup', day_of_week: 5, start_time: '15:30', end_time: '19:30', slot_minutes: 30, active: true },
    { id: 'oct-23-delivery', day_of_week: 5, start_time: '18:00', end_time: '19:30', slot_minutes: 30, active: true },
    { id: 'oct-24-delivery', day_of_week: 6, start_time: '09:00', end_time: '14:30', slot_minutes: 30, active: true },
  ],
}

function draft(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    items: [{ product_id: 'matcha', quantity: 1 }], packaging: 'standard', card_message: '',
    customer: { first_name: 'Ray', last_name: 'Customer', phone: '(555) 123-4567', email: '', social_handle: '' },
    pickup_date: '2026-10-21', pickup_time: '12:30', pickup_window_id: 'oct-21-lawn-tabling', payment_method: 'venmo', request_id: crypto.randomUUID(),
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
    expect(priced(2)).toBe(800)
    expect(priced(3)).toBe(1100)
    expect(priced(4)).toBe(1500)
    expect(priced(5)).toBe(1800)
    expect(priced(6)).toBe(2200)
    expect(priced(8)).toBe(2900)
    expect(priced(10)).toBe(3600)
  })

  it('creates start-inclusive, end-exclusive pickup slots', () => {
    expect(pickupSlots('2026-10-21', data.windows).map(slot => slot.label)).toEqual(['Lawn tabling · 12:30 PM', 'Lawn tabling · 1:00 PM', 'Lawn tabling · 1:30 PM', 'Lawn tabling · 2:00 PM', 'Lawn tabling · 2:30 PM', 'Lawn tabling · 3:00 PM'])
    expect(pickupSlots('2026-10-23', data.windows).map(slot => slot.label)).toEqual(['Pickup · 3:30 PM', 'Pickup · 4:00 PM', 'Pickup · 4:30 PM', 'Pickup · 5:00 PM', 'Pickup · 5:30 PM', 'Pickup · 6:00 PM', 'Delivery · 6:00 PM', 'Pickup · 6:30 PM', 'Delivery · 6:30 PM', 'Pickup · 7:00 PM', 'Delivery · 7:00 PM'])
    expect(pickupSlots('2026-10-24', data.windows).map(slot => slot.time)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00'])
    expect(pickupSlots('2026-10-22', data.windows)).toEqual([])
  })

  it('adds two local calendar days across month and daylight-saving boundaries', () => {
    expect(earliestPickupDate('America/New_York', new Date('2025-12-31T23:00:00Z'))).toBe('2026-01-02')
    expect(earliestPickupDate('America/New_York', new Date('2026-03-07T05:30:00Z'))).toBe('2026-03-09')
  })

  it('requires a card message and leaves standard packaging free', () => {
    expect(selectionErrors(draft({ packaging: 'card' }), data)).toHaveProperty('card_message')
    expect(selectionErrors(draft(), data)).not.toHaveProperty('card_message')
  })

  it('rejects more than four of a flavor or ten cookies total', () => {
    expect(selectionErrors(draft({ items: [{ product_id: 'matcha', quantity: 5 }] }), data)).toHaveProperty('order')
    expect(selectionErrors(draft({ items: [{ product_id: 'matcha', quantity: 6 }, { product_id: 'mango', quantity: 5 }] }), data)).toHaveProperty('order')
  })

  it('validates required contact, payment, lead time, and exact pickup slot', () => {
    const beforeCutoff = new Date('2026-10-20T23:59:00Z')
    expect(validateDraft(draft(), data, beforeCutoff)).toEqual({})
    const errors = validateDraft(draft({ customer: { first_name: '', last_name: '', phone: '123', email: 'bad', social_handle: '' }, pickup_time: '12:45' }), data, beforeCutoff)
    expect(errors).toMatchObject({ first_name: expect.any(String), last_name: expect.any(String), phone: expect.any(String), email: expect.any(String), pickup_time: expect.any(String) })
    expect(validateDraft(draft(), data, new Date('2026-10-21T00:00:01Z'))).toHaveProperty('order')
  })
})
