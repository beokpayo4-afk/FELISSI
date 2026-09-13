import { useEffect, useState, type FormEvent } from "react";
import type { ShopQuery } from "@/lib/shopQuery";
import type { ApiNamedSlug } from "@/types/catalog";

export function ShopFilters({
  query,
  categories,
  brands,
  subcategories,
  onChange,
  onClear,
  idPrefix = "shop",
  showKeywordSearch = true,
}: {
  query: ShopQuery;
  categories: ApiNamedSlug[];
  brands: ApiNamedSlug[];
  subcategories: ApiNamedSlug[];
  onChange: (patch: Partial<ShopQuery>) => void;
  onClear: () => void;
  idPrefix?: string;
  showKeywordSearch?: boolean;
}) {
  const [minPrice, setMinPrice] = useState(query.min_price ?? "");
  const [maxPrice, setMaxPrice] = useState(query.max_price ?? "");
  const [search, setSearch] = useState(query.search ?? "");

  useEffect(() => {
    setSearch(query.search ?? "");
    setMinPrice(query.min_price ?? "");
    setMaxPrice(query.max_price ?? "");
  }, [query.search, query.min_price, query.max_price]);

  function applyPrices(event: FormEvent) {
    event.preventDefault();
    onChange({ min_price: minPrice, max_price: maxPrice });
  }

  function applySearch(event: FormEvent) {
    event.preventDefault();
    onChange({ search: search.trim() });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-950 uppercase">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          Clear all
        </button>
      </div>

      {showKeywordSearch ? (
        <form onSubmit={applySearch} className="space-y-2">
          <label htmlFor={`${idPrefix}-search`} className="text-sm font-medium text-slate-900">
            Search
          </label>
          <input
            id={`${idPrefix}-search`}
            name={`${idPrefix}_search`}
            type="search"
            value={search}
            autoComplete="off"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, brand, SKU…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="submit"
            className="h-10 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Search
          </button>
        </form>
      ) : null}

      <FilterGroup
        legend="Category"
        name={`${idPrefix}-category`}
        value={query.category}
        options={categories}
        onSelect={(slug) => onChange({ category: slug })}
      />

      <FilterGroup
        legend="Subcategory"
        name={`${idPrefix}-subcategory`}
        value={query.subcategory}
        options={subcategories}
        disabled={!query.category}
        emptyLabel={query.category ? "No subcategories" : "Choose a category first"}
        onSelect={(slug) => onChange({ subcategory: slug })}
      />

      <FilterGroup
        legend="Brand"
        name={`${idPrefix}-brand`}
        value={query.brand}
        options={brands}
        onSelect={(slug) => onChange({ brand: slug })}
      />

      <form onSubmit={applyPrices} className="space-y-3">
        <p className="text-sm font-medium text-slate-900">Price (₹)</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-min-price`}>
            Minimum price
          </label>
          <input
            id={`${idPrefix}-min-price`}
            name={`${idPrefix}_min_price`}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            autoComplete="off"
            onChange={(event) => setMinPrice(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <label className="sr-only" htmlFor={`${idPrefix}-max-price`}>
            Maximum price
          </label>
          <input
            id={`${idPrefix}-max-price`}
            name={`${idPrefix}_max_price`}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            autoComplete="off"
            onChange={(event) => setMaxPrice(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <button
          type="submit"
          className="h-10 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 hover:border-sky-300 hover:text-sky-800"
        >
          Apply price
        </button>
      </form>
    </div>
  );
}

function FilterGroup({
  legend,
  name,
  value,
  options,
  onSelect,
  disabled,
  emptyLabel,
}: {
  legend: string;
  name: string;
  value?: string;
  options: ApiNamedSlug[];
  onSelect: (slug?: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
}) {
  const allId = `${name}-all`;
  return (
    <fieldset disabled={disabled} className="space-y-2 disabled:opacity-60">
      <legend className="text-sm font-medium text-slate-900">{legend}</legend>
      <label htmlFor={allId} className="flex items-center gap-2 text-sm text-slate-700">
        <input
          id={allId}
          type="radio"
          name={name}
          checked={!value}
          onChange={() => onSelect(undefined)}
          className="accent-sky-600"
        />
        All
      </label>
      {options.length === 0 && emptyLabel ? (
        <p className="text-xs text-slate-500">{emptyLabel}</p>
      ) : (
        options.map((option) => {
          const optionId = `${name}-${option.slug}`;
          return (
            <label
              key={option.slug}
              htmlFor={optionId}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                checked={value === option.slug}
                onChange={() => onSelect(option.slug)}
                className="accent-sky-600"
              />
              {option.name}
            </label>
          );
        })
      )}
    </fieldset>
  );
}
