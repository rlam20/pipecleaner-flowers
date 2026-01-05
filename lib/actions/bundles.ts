'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type CreateBundleInput = {
  name: string
  description: string
  price: number
  image_url: string
  flower_composition: { flower_name: string; quantity: number }[]
  color_themes: string[]
}

export async function createBundle(input: CreateBundleInput) {
  const supabase = await createClient()

  // Validate
  if (!input.name || input.price <= 0) {
    return { success: false, error: 'Invalid name or price' }
  }

  if (input.flower_composition.length === 0) {
    return { success: false, error: 'Must include at least one flower' }
  }

  if (input.color_themes.length === 0) {
    return { success: false, error: 'Must include at least one color theme' }
  }

  // Insert bundle
  const { data, error } = await supabase
    .from('preset_bundles')
    .insert({
      name: input.name,
      description: input.description,
      price: input.price,
      image_url: input.image_url,
      flower_composition: input.flower_composition,
      color_themes: input.color_themes
    })
    .select()
    .single()

  if (error) {
    console.error('Bundle creation failed:', error)
    return { success: false, error: 'Failed to create bundle' }
  }

  revalidatePath('/admin')
  revalidatePath('/premade')

  return { success: true, bundle: data }
}