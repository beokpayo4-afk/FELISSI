import {
  SORT_OPTIONS,
  patchShopParams,
  shopQueryFromParams,
  type ShopQuery,
} from "@/lib/shopQuery";

export const DEFAULT_SEARCH_ORDERING = "-search_rank";

export const SEARCH_SORT_OPTIONS = [
  { value: DEFAULT_SEARCH_ORDERING, label: "Relevance" },
  ...SORT_OPTIONS,
] as const;

export type SearchSortValue = (typeof SEARCH_SORT_OPTIONS)[number]["value"];

export function searchQueryFromParams(params: URLSearchParams): ShopQuery {
  const query = shopQueryFromParams(params);
  const q = params.get("q")?.trim() || query.search;
  return {
    ...query,
    search: q || undefined,
  };
}

export function searchPathFromShopParams(params: URLSearchParams): string | null {
  const search = params.get("search")?.trim();
  if (!search) {
    return null;
  }
  const next = new URLSearchParams(params);
  next.set("q", search);
  next.delete("search");
  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}

export function patchSearchParams(
  current: URLSearchParams,
  patch: Partial<ShopQuery>,
): URLSearchParams {
  const next = patchShopParams(current, { ...patch, search: undefined });
  next.delete("search");
  if (Object.hasOwn(patch, "search")) {
    const value = patch.search?.trim();
    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
  }
  if (next.get("ordering") === DEFAULT_SEARCH_ORDERING) {
    next.delete("ordering");
  }
  return next;
}

export function countSearchFilters(query: ShopQuery): number {
  return (
    Number(Boolean(query.category)) +
    Number(Boolean(query.subcategory)) +
    Number(Boolean(query.brand)) +
    Number(Boolean(query.min_price)) +
    Number(Boolean(query.max_price)) +
    Number(query.featured === "true") +
    Number(query.best_seller === "true")
  );
}

export function isKnownSearchSort(value: string | undefined): value is SearchSortValue {
  return SEARCH_SORT_OPTIONS.some((option) => option.value === value);
}

export function searchTitle(query: string | undefined): string {
  if (query) {
    return `Results for “${query}”`;
  }
  return "Search products";
}
