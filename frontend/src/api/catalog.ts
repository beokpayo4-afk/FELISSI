import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { SHOP_PAGE_SIZE, type ShopQuery } from "@/lib/shopQuery";
import type { Paginated } from "@/types/api";
import type {
  ApiNamedSlug,
  ApiProduct,
  ApiProductDetail,
  ApiReview,
  SearchSuggestions,
} from "@/types/catalog";

export function listProducts(
  query: ShopQuery,
  options?: { signal?: AbortSignal; pageSize?: number },
): Promise<Paginated<ApiProduct>> {
  const params: Record<string, string | number> = {
    page_size: options?.pageSize ?? SHOP_PAGE_SIZE,
  };

  if (query.search) params.search = query.search;
  if (query.category) params.category = query.category;
  if (query.subcategory) params.subcategory = query.subcategory;
  if (query.brand) params.brand = query.brand;
  if (query.min_price) params.min_price = query.min_price;
  if (query.max_price) params.max_price = query.max_price;
  if (query.ordering) params.ordering = query.ordering;
  if (query.page) params.page = query.page;
  if (query.featured) params.featured = query.featured;
  if (query.best_seller) params.best_seller = query.best_seller;

  return apiClient
    .get<Paginated<ApiProduct>>(endpoints.products, { params, signal: options?.signal })
    .then((response) => response.data);
}

export function fetchSearchSuggestions(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<SearchSuggestions> {
  return apiClient
    .get<SearchSuggestions>(endpoints.productSuggest, {
      params: { q: query },
      signal: options?.signal,
    })
    .then((response) => response.data);
}

export function listCategories(options?: { signal?: AbortSignal }): Promise<ApiNamedSlug[]> {
  return apiClient
    .get<Paginated<ApiNamedSlug>>(endpoints.categories, {
      params: { page_size: 50 },
      signal: options?.signal,
    })
    .then((response) => response.data.results);
}

export function listBrands(options?: { signal?: AbortSignal }): Promise<ApiNamedSlug[]> {
  return apiClient
    .get<ApiNamedSlug[]>(endpoints.brands, { signal: options?.signal })
    .then((response) => response.data);
}

export function getProduct(
  slug: string,
  options?: { signal?: AbortSignal },
): Promise<ApiProductDetail> {
  return apiClient
    .get<ApiProductDetail>(endpoints.productDetail(slug), { signal: options?.signal })
    .then((response) => response.data);
}

export function listProductReviews(
  slug: string,
  options?: { signal?: AbortSignal },
): Promise<Paginated<ApiReview>> {
  return apiClient
    .get<Paginated<ApiReview>>(endpoints.productReviews(slug), { signal: options?.signal })
    .then((response) => response.data);
}

export function listSubcategories(
  categorySlug: string,
  options?: { signal?: AbortSignal },
): Promise<ApiNamedSlug[]> {
  return apiClient
    .get<ApiNamedSlug[]>(endpoints.categorySubcategories(categorySlug), {
      signal: options?.signal,
    })
    .then((response) => response.data);
}
