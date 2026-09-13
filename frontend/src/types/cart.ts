import type { ApiProduct } from "@/types/catalog";

export interface ApiCartItem {
  id: number | null;
  product: ApiProduct;
  variant_id: number | null;
  variant_name: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface ApiCartQuote {
  items: ApiCartItem[];
  item_count: number;
  subtotal: string;
  discount: string;
  gst: string;
  gst_inclusive?: boolean;
  taxable_subtotal?: string;
  shipping_charge: string;
  total: string;
  coupon_code: string | null;
  coupon_error: string | null;
}

export interface ApiCart extends ApiCartQuote {
  id: string;
  updated_at: string;
}

export interface QuoteItemInput {
  product_id: string;
  quantity: number;
  variant_id?: number | null;
}

export interface CartLine {
  key: string;
  cartItemId: number | null;
  productId: string;
  variantId: number | null;
  variantName: string | null;
  name: string;
  slug: string;
  image: string;
  imageAlt: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stockQuantity: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  gst: number;
  gstInclusive: boolean;
  shipping: number;
  total: number;
}
