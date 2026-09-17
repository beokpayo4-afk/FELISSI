import { resolveMediaUrl } from "@/lib/env";
import type { ApiProduct, CatalogProduct } from "@/types/catalog";

export function toNumber(value: string | number | null | undefined): number {
  if (value == null || value === "") {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isStorefrontProductImage(src: string | null | undefined): boolean {
  if (!src) {
    return false;
  }
  const value = src.toLowerCase();
  if (value.includes("/placeholders/") || value.includes("/catalog/")) {
    return false;
  }
  return (
    value.includes("/uploads/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  );
}

export function storefrontProductImage(
  url: string | null | undefined,
  fallback = "/placeholders/product.svg",
): string {
  const resolved = resolveMediaUrl(url);
  return isStorefrontProductImage(resolved) ? resolved : fallback;
}

export function toCatalogProduct(product: ApiProduct): CatalogProduct {
  const sale = product.sale_price == null ? undefined : toNumber(product.sale_price);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: storefrontProductImage(product.primary_image?.url),
    imageAlt: product.primary_image?.alt_text || product.name,
    price: toNumber(product.price),
    salePrice: sale && sale > 0 ? sale : undefined,
    rating: toNumber(product.average_rating),
    reviewCount: product.review_count ?? 0,
    category: product.category.slug,
    gstInclusive: product.gst_inclusive,
    gstPercentage: toNumber(product.gst_percentage),
  };
}
