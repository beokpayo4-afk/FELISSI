import type { ApiAddress } from "@/types/auth";

export type PaymentMethod = "cod" | "online";

export interface ApiOrderItem {
  id: number;
  product_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  gst_percentage?: string;
  taxable_amount?: string;
  gst_amount?: string;
}

export interface ApiOrder {
  id: string;
  order_number: string;
  subtotal: string;
  discount: string;
  gst: string;
  gst_inclusive?: boolean;
  taxable_subtotal?: string;
  shipping_charge: string;
  total: string;
  payment_method: PaymentMethod;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at?: string;
  shipping_address?: ApiAddress;
  items?: ApiOrderItem[];
  payment?: {
    status: string;
    provider?: string;
    order_number?: string;
    message?: string;
  };
}

export interface CreateOrderPayload {
  shipping_address_id: string;
  coupon_code?: string;
  payment_method: PaymentMethod;
  client_request_id: string;
}

export interface PaymentConfig {
  provider: string;
  configured: boolean;
  collects_card_on_site: boolean;
  methods: Array<{
    id: PaymentMethod;
    label: string;
    available: boolean;
    ready: boolean;
  }>;
}
