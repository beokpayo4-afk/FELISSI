export const SHOP_PAGE_SIZE = 12;
export const DEFAULT_ORDERING = "-created_at";

export const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest" },
  { value: "effective_price", label: "Price: low to high" },
  { value: "-effective_price", label: "Price: high to low" },
  { value: "-popularity", label: "Popularity" },
  { value: "-average_rating", label: "Rating" },
] as const;

export type ShopSortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface ShopQuery {
  search?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  min_price?: string;
  max_price?: string;
  ordering?: string;
  page?: string;
  featured?: string;
  best_seller?: string;
}

const KEYS = [
  "search",
  "category",
  "subcategory",
  "brand",
  "min_price",
  "max_price",
  "ordering",
  "page",
  "featured",
  "best_seller",
] as const satisfies ReadonlyArray<keyof ShopQuery>;

const FILTER_KEYS: Array<keyof ShopQuery> = [
  "search",
  "category",
  "subcategory",
  "brand",
  "min_price",
  "max_price",
  "featured",
  "best_seller",
];

export function shopQueryFromParams(params: URLSearchParams): ShopQuery {
  const query: ShopQuery = {};
  for (const key of KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      query[key] = value;
    }
  }
  return query;
}

export function patchShopParams(
  current: URLSearchParams,
  patch: Partial<ShopQuery>,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const categoryChanged = Object.hasOwn(patch, "category") && patch.category !== current.get("category");

  for (const [key, value] of Object.entries(patch) as Array<[keyof ShopQuery, string | undefined]>) {
    if (value == null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }

  if (categoryChanged) {
    next.delete("subcategory");
  }

  const resetsPage =
    FILTER_KEYS.some((key) => Object.hasOwn(patch, key)) || Object.hasOwn(patch, "ordering");
  if (resetsPage && !Object.hasOwn(patch, "page")) {
    next.delete("page");
  }

  if (next.get("page") === "1") {
    next.delete("page");
  }

  return next;
}

export function shopQueryKey(query: ShopQuery): string {
  return JSON.stringify(query);
}

export function isKnownSort(value: string | undefined): value is ShopSortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export function shopTitle(query: ShopQuery): string {
  if (query.search) {
    return `Results for “${query.search}”`;
  }
  if (query.featured === "true") {
    return "Featured products";
  }
  if (query.best_seller === "true") {
    return "Best sellers";
  }
  if (query.category) {
    return titleCase(query.category.replaceAll("-", " "));
  }
  return "All products";
}

export function countActiveFilters(query: ShopQuery): number {
  return FILTER_KEYS.reduce((total, key) => total + (query[key] ? 1 : 0), 0);
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
