import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { ApiWishlistItem } from "@/types/wishlist";

export function fetchWishlist(): Promise<ApiWishlistItem[]> {
  return apiClient.get<ApiWishlistItem[]>(endpoints.wishlist).then((response) => response.data);
}

export function addWishlistItem(productId: string): Promise<ApiWishlistItem> {
  return apiClient
    .post<ApiWishlistItem>(endpoints.wishlist, { product_id: productId })
    .then((response) => response.data);
}

export function removeWishlistItem(productId: string): Promise<void> {
  return apiClient.delete(endpoints.wishlistItem(productId)).then(() => undefined);
}
