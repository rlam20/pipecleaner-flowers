import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { CookieProduct, PickupWindow, StorefrontData, StoreSettings } from '@/lib/types'

// Presentation fallback only. Orders require a successfully loaded Supabase catalog.
const fallbackProducts: CookieProduct[] = [
  {
    id: 'spindle-and-spice', name: 'Spindle and Spice',
    description: 'A soft cinnamon-butter cookie swirled with gooey cinnamon filling, topped with vanilla glaze and a spooky halal marshmallow spiderweb.',
    image_url: '/cookies/spindle-and-spice.png', unit_price_cents: 300, sort_order: 1, active: true,
  },
  {
    id: 'draculas-kiss', name: 'Dracula’s Kiss',
    description: 'A rich chocolate cookie with a blood-red raspberry center and chocolate drizzle. Love at first bite.',
    image_url: '/cookies/draculas-kiss.png', unit_price_cents: 300, sort_order: 2, active: true,
  },
  {
    id: 'coraline-cheesecake', name: 'Coraline Cheesecake',
    description: 'A dark chocolate cookie with a creamy cheesecake center, ube purple drizzle, and golden stars.',
    image_url: '/cookies/coraline-cheesecake.png', unit_price_cents: 300, sort_order: 3, active: true,
  },
  {
    id: 'mummys-favorite', name: 'Mummy’s Favorite',
    description: 'A warm chai-spiced Biscoff cookie loaded with white chocolate chips and wrapped in a mummy-inspired white chocolate drizzle.',
    image_url: '/cookies/mummys-favorite.png', unit_price_cents: 300, sort_order: 4, active: true,
  },
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
        .select('id,name,description,image_url,unit_price_cents,sort_order,active')
        .eq('active', true).order('sort_order').order('name'),
      supabase.from('cookie_store_settings')
        .select('time_zone,pickup_location,venmo_handle,zelle_recipient,instagram_url')
        .eq('id', true).maybeSingle(),
      supabase.from('cookie_pickup_windows')
        .select('id,day_of_week,start_time,end_time,slot_minutes,active')
        .eq('active', true).not('id', 'ilike', '%tabling%').order('day_of_week').order('start_time'),
    ])

    if (productResult.error || settingsResult.error || windowResult.error) return fallback
    const products: CookieProduct[] = (productResult.data ?? []).filter((product) =>
      typeof product.id === 'string' && typeof product.name === 'string'
      && Number.isSafeInteger(product.unit_price_cents) && product.unit_price_cents > 0
    ).map((product) => ({
      ...product,
      description: typeof product.description === 'string' ? product.description : '',
      image_url: typeof product.image_url === 'string' ? product.image_url : '/cookies/matcha.webp',
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
      available: products.length > 0 && windows.length > 0 && Boolean(settings.zelle_recipient),
    }
  } catch {
    return fallback
  }
}
