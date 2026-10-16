import type { CookieProduct, OrderDraft, OrderItemInput, OrderLine, PickupSlot, PickupWindow, StorefrontData } from './types'

export const FULFILLMENT_DATES = ['2026-10-21', '2026-10-23', '2026-10-25'] as const
export const CURRENT_PICKUP_DATE = FULFILLMENT_DATES[0]
export const ORDER_CUTOFF = new Date('2026-10-21T00:00:00Z')
export const FUNDRAISER_MODE = true
export const MAX_ORDER_QUANTITY = 10
export const MAX_FLAVOR_QUANTITY = 4

export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
export const isOrderingOpen = (now = new Date()) => now.getTime() <= ORDER_CUTOFF.getTime()
export const totalQuantity = (items: OrderItemInput[]) => items.reduce((sum, item) => sum + item.quantity, 0)
export function orderTotal(lines: OrderLine[]): number {
  const quantity = totalQuantity(lines)
  const subtotal = lines.reduce((sum, line) => sum + line.line_total_cents, 0)
  const discount = Math.floor(quantity / 5) * 200 + Math.floor((quantity % 5) / 3) * 100
  return subtotal - discount
}
export const orderCategory = (quantity: number): 'snack' | 'party' => quantity >= 7 ? 'party' : 'snack'
export const categoryLabel = (category: 'snack' | 'party') => category === 'party' ? 'Party Pack' : 'Snack Pick Up'

export function orderLines(items: OrderItemInput[], products: CookieProduct[]): OrderLine[] {
  return items.flatMap(item => {
    const product = products.find(product => product.id === item.product_id && product.active)
    return product ? [{ ...item, name: product.name, unit_price_cents: product.unit_price_cents, line_total_cents: item.quantity * product.unit_price_cents }] : []
  })
}

export function businessDate(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = (type: string) => parts.find(part => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function earliestPickupDate(timeZone: string, now = new Date()): string {
  const date = new Date(`${businessDate(timeZone, now)}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 2)
  return date.toISOString().slice(0, 10)
}

export function formatDate(value: string): string {
  return validDate(value) ? new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)) : value
}

export function formatTime(value: string): string {
  const [hour, minute] = value.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function pickupSlots(date: string, windows: PickupWindow[]): PickupSlot[] {
  if (!validDate(date) || !FULFILLMENT_DATES.includes(date as typeof FULFILLMENT_DATES[number])) return []
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
  return windows.filter(window => window.active && window.day_of_week === weekday).flatMap(window => {
    const slots: PickupSlot[] = []
    if (!Number.isInteger(window.slot_minutes) || window.slot_minutes <= 0) return slots
    for (let current = minutes(window.start_time); current + window.slot_minutes <= minutes(window.end_time); current += window.slot_minutes) {
      const time = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
      const method = window.id.includes('delivery') ? 'Delivery' : window.id.includes('lawn-tabling') ? 'Lawn tabling' : 'Pickup'
      slots.push({ window_id: window.id, time, label: `${method} · ${formatTime(time)}` })
    }
    return slots
  }).sort((a, b) => a.time.localeCompare(b.time))
}

export function emptyDraft(): OrderDraft {
  return {
    items: [], packaging: 'standard', card_message: '',
    customer: { first_name: '', last_name: '', phone: '', email: '', social_handle: '' },
    pickup_date: CURRENT_PICKUP_DATE, pickup_time: '', pickup_window_id: '', payment_method: 'zelle', request_id: '',
  }
}

export function selectionErrors(draft: OrderDraft, data: StorefrontData, now = new Date()): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.available) errors.order = 'Ordering is not available just yet. Please check back soon.'
  if (!isOrderingOpen(now)) errors.order = 'Preorders closed Tuesday, October 20 at 8:00 PM.'
  if (!draft.items.length) errors.order = 'Choose at least one cookie to get started.'
  if (totalQuantity(draft.items) > MAX_ORDER_QUANTITY) errors.order = `Orders are limited to ${MAX_ORDER_QUANTITY} cookies. Need more? DM @doughnotdisturb_jz on Instagram.`
  if (draft.items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_FLAVOR_QUANTITY || !data.products.some(product => product.id === item.product_id && product.active))) {
    errors.order = `Each flavor is limited to ${MAX_FLAVOR_QUANTITY} cookies. Need more? DM @doughnotdisturb_jz on Instagram.`
  }
  if (new Set(draft.items.map(item => item.product_id)).size !== draft.items.length) errors.order = 'Please review your cookie quantities.'
  const total = orderTotal(orderLines(draft.items, data.products))
  if (!Number.isSafeInteger(total)) errors.order = 'This order is too large to calculate. Please reduce the quantity.'
  if (draft.packaging === 'card' && (!draft.card_message.trim() || draft.card_message.length > 500)) errors.card_message = 'Write a message of up to 500 characters for your card.'
  return errors
}

export function validateDraft(draft: OrderDraft, data: StorefrontData, now = new Date()): Record<string, string> {
  const errors = selectionErrors(draft, data, now)
  for (const field of ['first_name', 'last_name'] as const) {
    if (!draft.customer[field].trim() || draft.customer[field].trim().length > 80) errors[field] = `Enter your ${field.replace('_', ' ')} (up to 80 characters).`
  }
  const phone = draft.customer.phone.trim()
  const digits = phone.replace(/\D/g, '')
  if (!/^[+\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15 || phone.length > 40) errors.phone = 'Enter a valid phone number, including an area code.'
  const email = draft.customer.email.trim()
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = 'Enter a valid email address or leave this blank.'
  if (draft.customer.social_handle.trim().length > 100) errors.social_handle = 'Keep your social handle under 100 characters.'
  if (!validDate(draft.pickup_date) || !FULFILLMENT_DATES.includes(draft.pickup_date as typeof FULFILLMENT_DATES[number])) errors.pickup_date = 'Choose an available fulfillment date.'
  if (!pickupSlots(draft.pickup_date, data.windows).some(slot => slot.window_id === draft.pickup_window_id && slot.time === draft.pickup_time)) errors.pickup_time = 'Choose an available pickup time.'
  const recipient = draft.payment_method === 'venmo' ? data.settings.venmo_handle : draft.payment_method === 'zelle' ? data.settings.zelle_recipient : null
  if (!recipient) errors.payment_method = 'Please choose an available payment method.'
  return errors
}
