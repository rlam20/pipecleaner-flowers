'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${date}-${random}`
}

type CreateOrderInput = {
  order_type: 'bundle' | 'custom' | 'individual'
  customer_name: string
  customer_phone: string
  customer_email?: string
  recipient_name?: string
  notes?: string
  
  // For bundle orders
  preset_bundle_id?: string
  selected_theme?: string
  
  // For custom/individual orders
  custom_bouquet?: any
  
  total_price: number
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = await createClient()

  // Validate required fields
  if (!input.customer_name || !input.customer_phone) {
    return { success: false, error: 'Name and phone are required' }
  }

  if (input.order_type === 'bundle' && !input.preset_bundle_id) {
    return { success: false, error: 'Bundle ID required' }
  }

  if ((input.order_type === 'custom' || input.order_type === 'individual') && !input.custom_bouquet) {
    return { success: false, error: 'Order details required' }
  }

  // Generate unique order number
  const order_number = generateOrderNumber()

  // Prepare order data
  const orderData: any = {
    order_number,
    order_type: input.order_type,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    customer_email: input.customer_email || null,
    recipient_name: input.recipient_name || null,
    notes: input.notes || null,
    total_price: input.total_price,
    status: 'awaiting_payment'
  }

  if (input.order_type === 'bundle') {
    orderData.preset_bundle_id = input.preset_bundle_id
    orderData.selected_theme = input.selected_theme
  } else {
    orderData.custom_bouquet = input.custom_bouquet
  }

  // Insert order
  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single()

  if (error) {
    console.error('Order creation failed:', error)
    return { success: false, error: 'Failed to create order' }
  }

  // TODO: Send email notification (we'll add this later)

  return { success: true, order_number }
}