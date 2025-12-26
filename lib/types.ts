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
  id: string; // unique ID for this selection (not flower type ID)
  flower_type_id: string;
  flower_name: string;
  color_id: string;
  color_name: string;
  price: number; // base_price + color modifier
};

export type CustomBouquetAddons = {
  wrapped: boolean; // +$2
  organization: 'maker' | 'diy'; // radio
};

export type CustomBouquet = {
  flowers: SelectedFlower[];
  addons: CustomBouquetAddons;
  total_price: number;
};

export type OrderFormData = {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  recipient_name?: string;
  notes?: string;
};

export type Order = {
  id: string;
  order_number: string;
  order_type: 'premade' | 'custom';
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  recipient_name?: string;
  notes?: string;
  premade_bouquet_id?: string;
  custom_bouquet?: CustomBouquet;
  total_price: number;
  status: 'awaiting_payment' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
};