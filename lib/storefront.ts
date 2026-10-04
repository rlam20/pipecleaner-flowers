import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { CookieProduct, PickupWindow, StorefrontData, StoreSettings } from '@/lib/types'

// Presentation fallback only. Orders require a successfully loaded Supabase catalog.
const fallbackProducts: CookieProduct[] = [
  {
    id: 'matcha-neapolitan', name: 'Matcha Neapolitan',
    description: 'Three lovely layers. Earthy matcha, strawberry, and vanilla in one soft-baked cookie.',
    image_url: '/cookies/matcha.webp', unit_price_cents: 400, sort_order: 1, active: true,
  },
  {
    id: 'biscoff-chai', name: 'Biscoff Chai',
    description: 'A little spice, a little crunch. Chai warmth meets caramelized Biscoff.',
    image_url: '/cookies/biscoff.webp', unit_price_cents: 400, sort_order: 2, active: true,
  },
  {
    id: 'mango-lassi', name: 'Mango Lassi',
    description: 'A sunny little escape. Mango and creamy tang, inspired by a favorite sip.',
    image_url: '/cookies/mango.webp', unit_price_cents: 400, sort_order: 3, active: true,
  },
]

const fallbackSettings: StoreSettings = {
  time_zone: 'America/New_York', pickup_location: null,
  venmo_handle: 'juzaoi', zelle_recipient: null, instagram_url: null,
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
        .eq('active', true).order('day_of_week').order('start_time'),
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
      available: products.length > 0 && windows.length > 0 && Boolean(settings.venmo_handle || settings.zelle_recipient),
    }
  } catch {
    return fallback
  }
}
