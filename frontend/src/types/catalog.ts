export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  imageAlt: string;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  gstInclusive?: boolean;
  gstPercentage?: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  to: string;
  image: string;
  description: string;
}

export interface ApiNamedSlug {
  id: number;
  name: string;
  slug: string;
}

export interface ApiProductImage {
  id: number;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  brand: ApiNamedSlug;
  category: ApiNamedSlug;
  subcategory: ApiNamedSlug | null;
  price: string;
  sale_price: string | null;
  effective_price: string;
  average_rating: number | string;
  review_count: number;
  gst_percentage: string;
  gst_inclusive: boolean;
  taxable_price: string;
  gst_amount: string;
  inclusive_price: string;
  stock_quantity: number;
  is_featured: boolean;
  is_best_seller: boolean;
  primary_image: ApiProductImage | null;
  created_at: string;
}

export interface ApiProductVariant {
  id: number;
  name: string;
  sku: string;
  price: string | null;
  stock_quantity: number;
}

export interface ApiProductDetail extends ApiProduct {
  description: string;
  images: ApiProductImage[];
  variants: ApiProductVariant[];
  updated_at: string;
}

export interface SearchSuggestionProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  sale_price: string | null;
  brand: ApiNamedSlug;
  category: ApiNamedSlug;
  primary_image: ApiProductImage | null;
}

export interface SearchSuggestions {
  products: SearchSuggestionProduct[];
  brands: ApiNamedSlug[];
  categories: ApiNamedSlug[];
}

export interface ApiReview {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
}
