import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
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
import { searchPathFromShopParams } from "@/lib/searchQuery";
import {
  countActiveFilters,
  DEFAULT_ORDERING,
  patchShopParams,
  SHOP_PAGE_SIZE,
  shopQueryFromParams,
  shopTitle,
  type ShopQuery,
} from "@/lib/shopQuery";

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchPath = searchPathFromShopParams(params);
  const query = useMemo(() => shopQueryFromParams(params), [params]);
  const facets = useCatalogFacets(query.category);
  const products = useShopProducts(query, { enabled: !searchPath });
  const page = Number(query.page ?? 1);
  const activeFilters = countActiveFilters(query);

  if (searchPath) {
    return <Navigate to={searchPath} replace />;
  }

  function update(patch: Partial<ShopQuery>) {
    setParams(patchShopParams(params, patch), { replace: true });
  }

  function clearFilters() {
    setParams(new URLSearchParams(), { replace: true });
    setFiltersOpen(false);
  }

  const filterProps = {
    query,
    categories: facets.categories,
    brands: facets.brands,
    subcategories: facets.subcategories,
    onChange: update,
    onClear: clearFilters,
  };

  return (
    <Container className="py-8">
      <header className="mb-6">
        <p className="page-kicker">Shop</p>
        <h1 className="page-title mt-1 text-[1.75rem] sm:text-3xl">{shopTitle(query)}</h1>
        <p className="page-lede">{resultSummary(products, page)}</p>
      </header>

      <div className="lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="card sticky top-28 hidden p-5 lg:block">
          <ShopFilters {...filterProps} idPrefix="desktop" />
        </aside>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn btn-secondary h-10 px-4 lg:hidden"
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
              value={query.ordering ?? DEFAULT_ORDERING}
              onChange={(ordering) => update({ ordering })}
            />
          </div>

          <ActiveFilterChips query={query} onChange={update} onClear={clearFilters} />

          {products.status === "loading" ? <ProductGridSkeleton /> : null}
          {products.status === "error" ? (
            <ShopErrorState message={products.message} onRetry={products.reload} />
          ) : null}
          {products.status === "empty" ? <ShopEmptyState onClear={clearFilters} /> : null}
          {products.status === "ready" ? (
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
        <ShopFilters {...filterProps} idPrefix="mobile" />
      </FilterDrawer>
    </Container>
  );
}

function resultSummary(
  products: ReturnType<typeof useShopProducts>,
  page: number,
): string {
  if (products.status === "loading") {
    return "Loading products…";
  }
  if (products.status === "error") {
    return "Catalog unavailable";
  }
  if (products.status === "empty") {
    return "0 products";
  }
  const start = (page - 1) * SHOP_PAGE_SIZE + 1;
  const end = start + products.products.length - 1;
  return `Showing ${start}–${end} of ${products.count} products`;
}

function ActiveFilterChips({
  query,
  onChange,
  onClear,
}: {
  query: ShopQuery;
  onChange: (patch: Partial<ShopQuery>) => void;
  onClear: () => void;
}) {
  const chips: Array<{ key: keyof ShopQuery; label: string }> = [];
  if (query.search) chips.push({ key: "search", label: `Search: ${query.search}` });
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
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-sky-300 hover:text-sky-800"
        >
          {chip.label} ×
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="link-brand text-xs font-semibold"
      >
        Clear all
      </button>
    </div>
  );
}
