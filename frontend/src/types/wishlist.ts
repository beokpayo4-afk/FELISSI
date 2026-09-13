import type { ApiProduct } from "@/types/catalog";

export interface ApiWishlistItem {
  id: number;
  product: ApiProduct;
  created_at: string;
}
