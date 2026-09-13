import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Container } from "@/components/layout/Container";
import { FilterDrawer } from "@/components/shop/FilterDrawer";
import { ProductGridSkeleton } from "@/components/shop/ProductCardSkeleton";
import { ProductSortSelect } from "@/components/shop/ProductSortSelect";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ShopPagination } from "@/components/shop/ShopPagination";
import { useCatalogFacets } from "@/hooks/useCatalogFacets";
import { useShopProducts } from "@/hooks/useShopProducts";
import { SHOP_PAGE_SIZE, type ShopQuery } from "@/lib/shopQuery";
import {
  DEFAULT_SEARCH_ORDERING,
  SEARCH_SORT_OPTIONS,
  countSearchFilters,
  patchSearchParams,
  searchPathFromShopParams,
  searchQueryFromParams,
  searchTitle,
} from "@/lib/searchQuery";

export function SearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const legacyPath = searchPathFromShopParams(params);
  const query = useMemo(() => searchQueryFromParams(params), [params]);
  const hasQuery = Boolean(query.search);
  const facets = useCatalogFacets(query.category);
  const products = useShopProducts(query, { enabled: hasQuery });
  const page = Number(query.page ?? 1);
  const activeFilters = countSearchFilters(query);

  if (legacyPath) {
    return <Navigate to={legacyPath} replace />;
  }

  function update(patch: Partial<ShopQuery>) {
    setParams(patchSearchParams(params, patch), { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (query.search) {
      next.set("q", query.search);
    }
    setParams(next, { replace: true });
    setFiltersOpen(false);
  }

  const filterProps = {
    query,
    categories: facets.categories,
    brands: facets.brands,
    subcategories: facets.subcategories,
    onChange: update,
    onClear: clearFilters,
    showKeywordSearch: false,
  };

  return (
    <Container className="py-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-sky-700">Search</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          {searchTitle(query.search)}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{resultSummary(products, page, hasQuery)}</p>
      </header>

      <div className="lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="sticky top-28 hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
          <ShopFilters {...filterProps} idPrefix="search-desktop" />
        </aside>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilters ? (
                <span className="rounded-full bg-sky-600 px-1.5 text-[11px] text-white">
                  {activeFilters}
                </span>
              ) : null}
            </button>
            <ProductSortSelect
              value={query.ordering ?? DEFAULT_SEARCH_ORDERING}
              onChange={(ordering) => update({ ordering })}
              options={SEARCH_SORT_OPTIONS}
            />
          </div>

          <ActiveSearchFilterChips query={query} onChange={update} onClear={clearFilters} />

          {!hasQuery ? (
            <ShopEmptyState
              title="Search the catalog"
              message="Enter a product name, SKU, brand, or category in the search bar above."
              actionLabel="Browse shop"
              onClear={() => navigate("/shop")}
            />
          ) : null}
          {hasQuery && products.status === "loading" ? <ProductGridSkeleton /> : null}
          {hasQuery && products.status === "error" ? (
            <ShopErrorState message={products.message} onRetry={products.reload} />
          ) : null}
          {hasQuery && products.status === "empty" ? (
            <ShopEmptyState
              title={`No products found for “${query.search}”`}
              message={
                activeFilters
                  ? "Try clearing a filter or using a broader keyword."
                  : "Check the spelling, try the SKU, or search by brand or category."
              }
              actionLabel={activeFilters ? "Clear filters" : "Browse shop"}
              onClear={activeFilters ? clearFilters : () => navigate("/shop")}
            />
          ) : null}
          {hasQuery && products.status === "ready" ? (
            <>
              <ProductGrid products={products.products} layout="shop" />
              <ShopPagination
                page={page}
                count={products.count}
                onPageChange={(next) => update({ page: String(next) })}
              />
            </>
          ) : null}
        </div>
      </div>

      <FilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <ShopFilters {...filterProps} idPrefix="search-mobile" />
      </FilterDrawer>
    </Container>
  );
}

function resultSummary(
  products: ReturnType<typeof useShopProducts>,
  page: number,
  hasQuery: boolean,
): string {
  if (!hasQuery) {
    return "Type a keyword to find products";
  }
  if (products.status === "loading") {
    return "Searching products…";
  }
  if (products.status === "error") {
    return "Search unavailable";
  }
  if (products.status === "empty") {
    return "0 results";
  }
  const start = (page - 1) * SHOP_PAGE_SIZE + 1;
  const end = start + products.products.length - 1;
  return `Showing ${start}–${end} of ${products.count} results`;
}

function ActiveSearchFilterChips({
  query,
  onChange,
  onClear,
}: {
  query: ShopQuery;
  onChange: (patch: Partial<ShopQuery>) => void;
  onClear: () => void;
}) {
  const chips: Array<{ key: keyof ShopQuery; label: string }> = [];
  if (query.category) chips.push({ key: "category", label: `Category: ${query.category}` });
  if (query.subcategory) chips.push({ key: "subcategory", label: `Subcategory: ${query.subcategory}` });
  if (query.brand) chips.push({ key: "brand", label: `Brand: ${query.brand}` });
  if (query.min_price) chips.push({ key: "min_price", label: `Min ₹${query.min_price}` });
  if (query.max_price) chips.push({ key: "max_price", label: `Max ₹${query.max_price}` });
  if (query.featured === "true") chips.push({ key: "featured", label: "Featured" });
  if (query.best_seller === "true") chips.push({ key: "best_seller", label: "Best sellers" });

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange({ [chip.key]: undefined })}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-sky-300 hover:text-sky-800"
        >
          {chip.label} ×
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-semibold text-sky-700 hover:text-sky-800"
      >
        Clear filters
      </button>
    </div>
  );
}
