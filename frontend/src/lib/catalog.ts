import type { ApiProduct, CatalogProduct } from "@/types/catalog";

export function toNumber(value: string | number | null | undefined): number {
  if (value == null || value === "") {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toCatalogProduct(product: ApiProduct): CatalogProduct {
  const sale = product.sale_price == null ? undefined : toNumber(product.sale_price);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.primary_image?.url || "/placeholders/product.svg",
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
