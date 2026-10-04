'use server'

import { createClient } from '@/lib/supabase/server'
import { sendCookieOrderNotification } from '@/lib/email'
import { getStorefront } from '@/lib/storefront'
import type { CreateCookieOrderInput, CreateOrderResult, OrderReceipt } from '@/lib/types'

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validInputShape(input: unknown): input is CreateCookieOrderInput {
  if (!record(input) || !record(input.customer) || !record(input.expected_pickup)) return false
  const stringFields = ['request_id', 'packaging', 'card_message', 'pickup_date', 'pickup_time', 'pickup_window_id', 'payment_method', 'expected_payment_recipient']
  if (!stringFields.every((key) => typeof input[key] === 'string')) return false
  const customer = input.customer
  if (!['first_name', 'last_name', 'phone', 'email', 'social_handle'].every((key) => typeof customer[key] === 'string')) return false
  if (!Array.isArray(input.items) || !Array.isArray(input.expected_prices)) return false
  if (!input.items.every((item) => record(item) && typeof item.product_id === 'string' && Number.isSafeInteger(item.quantity))) return false
  if (!input.expected_prices.every((item) => record(item) && typeof item.product_id === 'string' && Number.isSafeInteger(item.unit_price_cents))) return false
  const pickup = input.expected_pickup
  return typeof pickup.time_zone === 'string'
    && (pickup.pickup_location === null || typeof pickup.pickup_location === 'string')
    && typeof pickup.start_time === 'string' && /^\d{2}:\d{2}(:00)?$/.test(pickup.start_time)
    && typeof pickup.end_time === 'string' && /^\d{2}:\d{2}(:00)?$/.test(pickup.end_time)
    && Number.isSafeInteger(pickup.slot_minutes)
}

function validReceipt(value: unknown): value is OrderReceipt {
  if (!record(value) || !Array.isArray(value.items) || value.items.length === 0) return false
  const stringFields = ['order_number', 'order_date', 'card_message', 'pickup_date', 'pickup_time', 'time_zone', 'payment_recipient']
  return stringFields.every((key) => typeof value[key] === 'string')
    && (value.order_type === 'snack' || value.order_type === 'party')
    && (value.packaging === 'standard' || value.packaging === 'card')
    && (value.payment_method === 'venmo' || value.payment_method === 'zelle')
    && (value.pickup_location === null || typeof value.pickup_location === 'string')
    && value.status === 'awaiting_payment'
    && Number.isSafeInteger(value.total_cents)
    && value.items.every((item) => record(item)
      && typeof item.product_id === 'string' && typeof item.name === 'string'
      && Number.isSafeInteger(item.quantity) && Number.isSafeInteger(item.unit_price_cents)
      && Number.isSafeInteger(item.line_total_cents))
}

export async function createCookieOrder(input: CreateCookieOrderInput): Promise<CreateOrderResult> {
  if (!validInputShape(input)) {
    return { success: false, code: 'validation', error: 'Please review your order details and try again.' }
  }

  // Send only the public contract. The RPC validates every field again, prices the
  // order, and serializes retries using request_id before touching stored orders.
  const payload: CreateCookieOrderInput = {
    request_id: input.request_id,
    items: input.items.map(({ product_id, quantity }) => ({ product_id, quantity })),
    packaging: input.packaging,
    card_message: input.card_message,
    customer: {
      first_name: input.customer.first_name, last_name: input.customer.last_name,
      phone: input.customer.phone, email: input.customer.email, social_handle: input.customer.social_handle,
    },
    pickup_date: input.pickup_date, pickup_time: input.pickup_time, pickup_window_id: input.pickup_window_id,
    payment_method: input.payment_method,
    expected_prices: input.expected_prices.map(({ product_id, unit_price_cents }) => ({ product_id, unit_price_cents })),
    expected_pickup: {
      ...input.expected_pickup,
      start_time: input.expected_pickup.start_time.slice(0, 5),
      end_time: input.expected_pickup.end_time.slice(0, 5),
    },
    expected_payment_recipient: input.expected_payment_recipient,
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('submit_cookie_order', { payload })
    if (error || !record(data)) {
      return { success: false, code: 'unavailable', error: 'We could not confirm your order. Please try again; your selections are saved.' }
    }
    if (data.success !== true) {
      const code = data.code === 'changed' || data.code === 'validation' ? data.code : 'unavailable'
      return {
        success: false, code,
        error: typeof data.error === 'string' ? data.error : 'Ordering is temporarily unavailable. Please try again shortly.',
        ...(code === 'changed' ? { storefront: await getStorefront() } : {}),
      }
    }
    if (!validReceipt(data.receipt)) {
      return { success: false, code: 'unavailable', error: 'We could not confirm your order. Please try again using the same selection.' }
    }
    if (data.created === true) {
      // Notification failure never changes a successfully committed order.
      try {
        await sendCookieOrderNotification(data.receipt, input.customer)
      } catch {
        console.error('Order saved; its email notification could not be sent.')
      }
    }
    return { success: true, receipt: data.receipt }
  } catch {
    return { success: false, code: 'unavailable', error: 'We could not confirm your order. Please try again; your selections are saved.' }
  }
}
