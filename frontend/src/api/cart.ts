import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { ApiCart, ApiCartQuote, QuoteItemInput } from "@/types/cart";

export function fetchCart(coupon?: string): Promise<ApiCart> {
  return apiClient
    .get<ApiCart>(endpoints.cart, { params: coupon ? { coupon } : undefined })
    .then((response) => response.data);
}

export function addCartItem(payload: QuoteItemInput, coupon?: string): Promise<ApiCart> {
  return apiClient
    .post<ApiCart>(endpoints.cartItems, payload, { params: coupon ? { coupon } : undefined })
    .then((response) => response.data);
}

export function updateCartItem(itemId: number, quantity: number, coupon?: string): Promise<ApiCart> {
  return apiClient
    .patch<ApiCart>(endpoints.cartItem(itemId), { quantity }, { params: coupon ? { coupon } : undefined })
    .then((response) => response.data);
}

export function removeCartItem(itemId: number): Promise<void> {
  return apiClient.delete(endpoints.cartItem(itemId)).then(() => undefined);
}

export function quoteCart(items: QuoteItemInput[], couponCode?: string): Promise<ApiCartQuote> {
  return apiClient
    .post<ApiCartQuote>(endpoints.cartQuote, {
      items,
      coupon_code: couponCode || undefined,
    })
    .then((response) => response.data);
}
