import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { CookieProduct, PickupWindow, StorefrontData, StoreSettings } from '@/lib/types'

// Presentation fallback only. Orders require a successfully loaded Supabase catalog.
const fallbackProducts: CookieProduct[] = [
  { id: 'far-from-the-tree', name: 'Far From the Tree', description: 'Red apple cider cookie studded with buttery stroopwafel pieces and topped with a caramel-filled stroopwafel heart.', image_url: '/cookies/far%20from%20the%20tree.png', unit_price_cents: 400, sort_order: 1, active: true, stock_quantity: 0 },
  { id: 'dirty-little-secret', name: 'Dirty Little Secret', description: 'Warmly spiced chai cookie infused with espresso, packed with white and milk chocolate chips, buttery toffee chunks, and finished with flaky sea salt.', image_url: '/cookies/Dirty%20little%20secret.png', unit_price_cents: 400, sort_order: 2, active: true, stock_quantity: 0 },
  { id: 'miso-happy', name: 'Miso Happy', description: 'Rich brown butter chocolate chip cookie with savory miso for the perfect balance of sweet, salty, and nutty flavors.', image_url: '/cookies/miso%20butter.png', unit_price_cents: 300, sort_order: 3, active: true, stock_quantity: 0 },
  { id: 'bueno-than-ever', name: 'Bueno Than Ever', description: 'A decadent cookie cake with fluffy whipped cream, rich Nutella, sweet jam, and cookie dough, topped with a Kinder Bueno and a fresh strawberry.', image_url: '/cookies/bueno_than_ever.png', unit_price_cents: 400, sort_order: 4, active: true, stock_quantity: 0 }
]

const fallbackSettings: StoreSettings = {
  time_zone: 'America/New_York', pickup_location: null,
  venmo_handle: null, zelle_recipient: '757-333-2559', instagram_url: null,
}

const nullableText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null

function validTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== 'string') return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export async function getStorefront(): Promise<StorefrontData> {
  const fallback: StorefrontData = {
    products: fallbackProducts, settings: fallbackSettings, windows: [], available: false,
  }
  try {
    const supabase = await createClient()
    const [productResult, settingsResult, windowResult] = await Promise.all([
      supabase.from('cookie_products')
        .select('id,name,description,image_url,unit_price_cents,sort_order,active,stock_quantity')
        .eq('active', true).order('sort_order').order('name'),
      supabase.from('cookie_store_settings')
        .select('time_zone,pickup_location,venmo_handle,zelle_recipient,instagram_url')
        .eq('id', true).maybeSingle(),
      supabase.from('cookie_pickup_windows')
        .select('id,day_of_week,start_time,end_time,slot_minutes,active,fulfillment_date,fulfillment_method')
        .eq('active', true).order('day_of_week').order('start_time'),
    ])

    if (productResult.error || settingsResult.error || windowResult.error) return fallback
    const products: CookieProduct[] = (productResult.data ?? []).filter((product) =>
      typeof product.id === 'string' && typeof product.name === 'string'
      && Number.isSafeInteger(product.unit_price_cents) && product.unit_price_cents > 0
    ).map((product) => ({
      ...product,
      description: nullableText(product.description) ?? fallbackProducts.find(fallback => fallback.id === product.id)?.description ?? '',
      image_url: nullableText(product.image_url) ?? fallbackProducts.find(fallback => fallback.id === product.id)?.image_url ?? '',
    }))

    const row = settingsResult.data
    if (!row || !validTimeZone(row.time_zone)) return { ...fallback, products: products.length ? products : fallback.products }
    const settings: StoreSettings = {
      time_zone: row.time_zone,
      pickup_location: nullableText(row.pickup_location),
      venmo_handle: nullableText(row.venmo_handle),
      zelle_recipient: nullableText(row.zelle_recipient),
      instagram_url: nullableText(row.instagram_url),
    }
    const windows: PickupWindow[] = (windowResult.data ?? []).filter((window) =>
      typeof window.id === 'string'
      && Number.isInteger(window.day_of_week) && window.day_of_week >= 0 && window.day_of_week <= 6
      && typeof window.start_time === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(window.start_time)
      && typeof window.end_time === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(window.end_time)
      && window.start_time < window.end_time
      && Number.isInteger(window.slot_minutes) && window.slot_minutes > 0
    ).map((window) => ({
      ...window, start_time: window.start_time.slice(0, 5), end_time: window.end_time.slice(0, 5),
    }))

    return {
      products, settings, windows,
      available: products.some(product => product.stock_quantity > 0) && windows.length > 0 && Boolean(settings.zelle_recipient),
    }
  } catch {
    return fallback
  }
}
