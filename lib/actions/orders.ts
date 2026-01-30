'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendOrderNotification } from '@/lib/email'

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

  // Fulfillment details
  fulfillment_method: 'pickup' | 'delivery'
  fulfillment_date?: string
  pickup_name?: string
  pickup_location?: string
  pickup_instructions?: string
  delivery_address?: string
  delivery_instructions?: string
  on_grounds_housing?: boolean
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
  let bundleName = undefined
    
    if (input.order_type === 'bundle' && input.preset_bundle_id) {
      const { data: bundleData } = await supabase
        .from('preset_bundles') // Ensure this matches your table name in Supabase
        .select('name')
        .eq('id', input.preset_bundle_id)
        .single()
        
      if (bundleData) {
        bundleName = bundleData.name
      }
    }
  // TODO: Send email notification (we'll add this later)
  try {
    await sendOrderNotification({
      order_number,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_email: input.customer_email,
      recipient_name: input.recipient_name,
      notes: input.notes,
      order_type: input.order_type,
      total_price: input.total_price,
      bundle_name: input.order_type === 'bundle' ? orderData.preset_bundle_id : undefined,
      selected_theme: input.selected_theme,
      custom_bouquet: input.custom_bouquet,

      // Fulfillment details
      fulfillment_method: input.fulfillment_method,
      fulfillment_date: input.fulfillment_date,
      pickup_name: input.fulfillment_method === 'pickup' ? input.pickup_name : undefined,
      pickup_location: input.fulfillment_method === 'pickup' ? input.pickup_location : undefined,
      pickup_instructions: input.fulfillment_method === 'pickup' ? input.pickup_instructions : undefined,
      delivery_address: input.fulfillment_method === 'delivery' ? input.delivery_address : undefined,
      delivery_instructions: input.fulfillment_method === 'delivery' ? input.delivery_instructions : undefined,
      on_grounds_housing: input.fulfillment_method === 'delivery' ? input.on_grounds_housing : undefined
    })
  } catch (emailError) {
    console.error('Email notification failed:', emailError)
    // Don't fail the order if email fails
  }
  return { success: true, order_number }
  
}

