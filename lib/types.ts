export type CookieProduct = {
  id: string
  name: string
  description: string
  image_url: string
  unit_price_cents: number
  sort_order: number
  active: boolean
}
export type StoreSettings = {
  time_zone: string
  pickup_location: string | null
  venmo_handle: string | null
  zelle_recipient: string | null
  instagram_url: string | null
}
export type PickupWindow = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_minutes: number
  active: boolean
}
export type PickupSlot = { window_id: string; time: string; label: string }
export type StorefrontData = {
  products: CookieProduct[]
  settings: StoreSettings
  windows: PickupWindow[]
  available: boolean
}
export type CustomerDetails = {
  first_name: string
  last_name: string
  phone: string
  email: string
  social_handle: string
}
export type OrderItemInput = { product_id: string; quantity: number }
export type Packaging = 'standard' | 'card'
export type PaymentMethod = 'venmo' | 'zelle'
export type OrderDraft = {
  items: OrderItemInput[]
  packaging: Packaging
  card_message: string
  customer: CustomerDetails
  pickup_date: string
  pickup_time: string
  pickup_window_id: string
  payment_method: PaymentMethod
  request_id: string
}
export type OrderLine = {
  product_id: string
  name: string
  quantity: number
  unit_price_cents: number
  line_total_cents: number
}
export type OrderReceipt = {
  order_number: string
  order_date: string
  items: OrderLine[]
  order_type: 'snack' | 'party'
  packaging: Packaging
  card_message: string
  total_cents: number
  pickup_date: string
  pickup_time: string
  pickup_location: string | null
  time_zone: string
  payment_method: PaymentMethod
  payment_recipient: string
  status: 'awaiting_payment'
}
export type CreateCookieOrderInput = OrderDraft & {
  expected_prices: { product_id: string; unit_price_cents: number }[]
  expected_pickup: {
    time_zone: string
    pickup_location: string | null
    start_time: string
    end_time: string
    slot_minutes: number
  }
  expected_payment_recipient: string
}
export type CreateOrderResult =
  | { success: true; receipt: OrderReceipt }
  | { success: false; code: 'changed' | 'validation' | 'unavailable'; error: string; storefront?: StorefrontData }
