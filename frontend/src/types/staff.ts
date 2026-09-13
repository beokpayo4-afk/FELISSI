export interface StaffDashboard {
  generated_at: string;
  timezone: string;
  totals: {
    products: number;
    products_all: number;
    orders: number;
    orders_pending: number;
    customers: number;
    revenue: string;
    revenue_today: string;
  };
  paid_orders: number;
  delivered: number;
  low_stock: number;
  pending_reviews: number;
  sales: Array<{ date: string; total: string }>;
  order_mix: {
    pending: number;
    paid: number;
    delivered: number;
    cancelled: number;
  };
}

export interface StaffProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  price: string;
  sale_price: string | null;
  gst_percentage: string;
  stock_quantity: number;
  is_published: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  brand: { id: number; name: string; slug: string };
  category: { id: number; name: string; slug: string };
  subcategory: { id: number; name: string; slug: string; category: number };
  images: StaffProductImage[];
  primary_image: StaffProductImage | null;
  created_at: string;
}

export interface StaffProductImage {
  id: number;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export interface StaffProductQuery {
  page?: number;
  search?: string;
  category?: string;
  brand?: string;
  is_published?: string;
  stock?: string;
  is_featured?: string;
  is_best_seller?: string;
  ordering?: string;
}

export interface StaffProductPayload {
  name: string;
  sku: string;
  short_description: string;
  description: string;
  brand: number;
  category: number;
  subcategory: number;
  price: string;
  sale_price?: string | null;
  gst_percentage?: string;
  stock_quantity: number;
  is_published: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  image_url?: string;
}

export interface StaffOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  item_count: number;
  created_at: string;
}

export interface StaffOptions {
  brands: Array<{ id: number; name: string; slug: string }>;
  categories: Array<{ id: number; name: string; slug: string }>;
  subcategories: Array<{ id: number; name: string; slug: string; category: number }>;
}
