// Replace the old premade types with these:

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
  color_themes: string[]; // e.g., ["Warm sunset", "Cool pastels", "Vibrant mix"]
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  order_type: 'bundle' | 'custom'; // Changed from 'premade'
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  recipient_name?: string;
  notes?: string;
  preset_bundle_id?: string; // Changed from premade_bouquet_id
  selected_theme?: string; // Which color theme they chose
  custom_bouquet?: CustomBouquet;
  total_price: number;
  status: 'awaiting_payment' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
};