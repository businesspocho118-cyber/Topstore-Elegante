export type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "enviado"
  | "entregado"
  | "cancelado";

export type OrderSource = "web" | "admin" | "whatsapp" | "instagram";

export interface ProductVariant {
  id: string;
  product_id: string;
  color_index: number;
  color_name: string;
  color_hex: string;
  images: string[];
  stock: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  ref_code: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  fabric_care: string;
  price: number;
  compare_at_price: number | null;
  sizes: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  color_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  image_url: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  payment_method: string;
  status: OrderStatus;
  source: OrderSource;
  subtotal: number;
  shipping_cost: number;
  total: number;
  tracking_code: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface StoreSettings {
  id: number;
  brand_name: string;
  tagline: string;
  whatsapp_number: string;
  instagram_handle: string;
  parent_brand_url: string;
  announcement_bar: string;
  shipping_note: string;
  default_shipping_cost: number;
}

export interface CartItem {
  key: string;
  product_id: string;
  variant_id: string;
  ref_code: string;
  product_name: string;
  color_name: string;
  color_hex: string;
  size: string;
  unit_price: number;
  quantity: number;
  image_url: string;
}
