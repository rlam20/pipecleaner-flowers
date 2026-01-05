// lib/types.ts

// Matches table: public.flower_types
export type FlowerType = {
  id: string;
  name: string;
  base_price: number; // In SQL this is base_price
  created_at?: string;
};

// Matches table: public.color_options
export type ColorOption = {
  id: string;
  name: string;
  price_modifier: number; // In SQL this is price_modifier
  created_at?: string;
};

// Matches table: public.preset_bundles
export type PresetBundle = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  flower_composition: {
    flower_name: string;
    quantity: number;
  }[];
  color_themes: string[]; 
  created_at: string;
};

// Matches table: public.orders
export type Order = {
  id: string;
  order_number: string;
  order_type: 'bundle' | 'custom' | 'individual'; // Added 'individual' from your SQL schema
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  recipient_name?: string;
  notes?: string;
  preset_bundle_id?: string;
  selected_theme?: string;
  custom_bouquet?: any; // Matches your jsonb column
  total_price: number;
  status: 'awaiting_payment' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};