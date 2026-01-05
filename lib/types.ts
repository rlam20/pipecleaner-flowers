// lib/types.ts

export type FlowerType = {
  id: string;
  name: string;
  base_price: number;
};

export type ColorOption = {
  id: string;
  name: string;
  price_modifier: number;
};

export type SelectedFlower = {
  id: string;
  flower_type_id: string;
  flower_name: string;
  color_id: string;
  color_name: string;
  price: number;
};

export type CustomBouquetAddons = {
  wrapped: boolean;
  organization: 'maker' | 'diy';
};

export type CustomBouquet = {
  flowers: SelectedFlower[];
  addons: CustomBouquetAddons;
  total_price: number;
};

export type FulfillmentMethod = 'pickup' | 'delivery';

export type PickupDetails = {
  pickup_name: string;
  pickup_date: string;
  pickup_location: 'Rice Hall' | 'Clemons Library';
  pickup_instructions?: string;
};

export type DeliveryDetails = {
  delivery_address: string;
  delivery_date: string;
  delivery_instructions?: string;
  on_grounds_housing: boolean;
};

export type OrderAddons = {
  pocky: boolean;
  vase: boolean;
  wrapped: boolean;
};

export type OrderFormData = {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  recipient_name?: string;
  notes?: string;
  
  fulfillment_method: FulfillmentMethod;
  fulfillment_date: string;
  
  // Pickup or delivery details
  pickup_details?: PickupDetails;
  delivery_details?: DeliveryDetails;
  
  // Add-ons
  addons: OrderAddons;
};

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

export type Order = {
  id: string;
  order_number: string;
  order_type: 'bundle' | 'custom' | 'individual';
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  recipient_name?: string;
  notes?: string;
  
  preset_bundle_id?: string;
  selected_theme?: string;
  custom_bouquet?: CustomBouquet;
  
  fulfillment_method: FulfillmentMethod;
  fulfillment_date: string;
  pickup_name?: string;
  pickup_location?: string;
  pickup_instructions?: string;
  delivery_address?: string;
  delivery_instructions?: string;
  on_grounds_housing?: boolean;
  
  addon_pocky: boolean;
  addon_vase: boolean;
  
  total_price: number;
  delivery_fee: number;
  status: 'awaiting_payment' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
};