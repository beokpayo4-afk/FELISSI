import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { deleteStaffProduct, fetchStaffOptions, listStaffProducts, patchStaffProduct } from "@/api/staff";
import { toNumber } from "@/lib/catalog";
import { resolveMediaUrl } from "@/lib/env";
import { formatInr } from "@/lib/money";
import type { StaffOptions, StaffProduct, StaffProductQuery } from "@/types/staff";

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800";

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest" },
  { value: "created_at", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
  { value: "stock_quantity", label: "Stock: low to high" },
];

type ProductFilters = Omit<StaffProductQuery, "page">;

const EMPTY_FILTERS: ProductFilters = {
  search: "",
  category: "",
  brand: "",
  is_published: "",
  stock: "",
  is_featured: "",
  is_best_seller: "",
  ordering: "-created_at",
};

export function AdminProductsPage() {
  const [items, setItems] = useState<StaffProduct[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [options, setOptions] = useState<StaffOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Products · FELISSI admin";
    fetchStaffOptions()
      .then(setOptions)
      .catch((err) => setError(getApiErrorMessage(err)));
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => {
        const next = searchInput.trim();
        if (current.search === next) {
          return current;
        }
        setPage(1);
        return { ...current, search: next };
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setPending(true);
    listStaffProducts({ ...filters, page })
      .then((result) => {
        if (!cancelled) {
          setItems(result.results);
          setCount(result.count);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPending(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  function updateFilter<K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function togglePublish(product: StaffProduct) {
    setBusyId(product.id);
    try {
      const updated = await patchStaffProduct(product.id, { is_published: !product.is_published });
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function removeProduct(product: StaffProduct) {
    const confirmed = window.confirm(`Delete “${product.name}”? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    setBusyId(product.id);
    try {
      await deleteStaffProduct(product.id);
      setItems((current) => current.filter((item) => item.id !== product.id));
      setCount((value) => Math.max(0, value - 1));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Products</h1>
          <p className="mt-1 text-sm text-slate-500">{count} catalogue items</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex h-10 items-center rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
        >
          + Add product
        </Link>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <label htmlFor="admin-product-search" className="block lg:col-span-1">
            <span className="mb-1 block text-xs font-medium text-slate-500">Search name or SKU</span>
            <input
              id="admin-product-search"
              name="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Harbor Pulse…"
              autoComplete="off"
              className={SELECT_CLASS}
            />
          </label>
          <FilterSelect
            label="Category"
            value={filters.category ?? ""}
            onChange={(value) => updateFilter("category", value)}
            emptyLabel="All categories"
            options={options?.categories ?? []}
          />
          <FilterSelect
            label="Brand"
            value={filters.brand ?? ""}
            onChange={(value) => updateFilter("brand", value)}
            emptyLabel="All brands"
            options={options?.brands ?? []}
          />
          <label htmlFor="admin-filter-status" className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Status</span>
            <select
              id="admin-filter-status"
              name="is_published"
              value={filters.is_published ?? ""}
              onChange={(event) => updateFilter("is_published", event.target.value)}
              autoComplete="off"
              className={SELECT_CLASS}
            >
              <option value="">All statuses</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </label>
          <label htmlFor="admin-filter-stock" className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Stock</span>
            <select
              id="admin-filter-stock"
              name="stock"
              value={filters.stock ?? ""}
              onChange={(event) => updateFilter("stock", event.target.value)}
              autoComplete="off"
              className={SELECT_CLASS}
            >
              <option value="">All stock</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
          <label htmlFor="admin-filter-featured" className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Featured</span>
            <select
              id="admin-filter-featured"
              name="is_featured"
              value={filters.is_featured ?? ""}
              onChange={(event) => updateFilter("is_featured", event.target.value)}
              autoComplete="off"
              className={SELECT_CLASS}
            >
              <option value="">Any</option>
              <option value="true">Featured</option>
              <option value="false">Not featured</option>
            </select>
          </label>
          <label htmlFor="admin-filter-bestseller" className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Bestseller</span>
            <select
              id="admin-filter-bestseller"
              name="is_best_seller"
              value={filters.is_best_seller ?? ""}
              onChange={(event) => updateFilter("is_best_seller", event.target.value)}
              autoComplete="off"
              className={SELECT_CLASS}
            >
              <option value="">Any</option>
              <option value="true">Bestseller</option>
              <option value="false">Not bestseller</option>
            </select>
          </label>
        </div>
        <label htmlFor="admin-filter-ordering" className="mt-3 block max-w-56">
          <span className="mb-1 block text-xs font-medium text-slate-500">Sort</span>
          <select
            id="admin-filter-ordering"
            name="ordering"
            value={filters.ordering ?? "-created_at"}
            onChange={(event) => updateFilter("ordering", event.target.value)}
            autoComplete="off"
            className={SELECT_CLASS}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-245 text-left text-[13px]">
            <thead className="bg-cream text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              <tr>
                <th className="sticky left-0 z-10 bg-cream px-3 py-3">Image</th>
                <th className="sticky left-14 z-10 bg-cream px-3 py-3">Product</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Brand</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">MRP</th>
                <th className="px-3 py-3">GST</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Flags</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending ? (
                <tr>
                  <td colSpan={13} className="px-3 py-10 text-center text-slate-500">
                    Loading products…
                  </td>
                </tr>
              ) : null}
              {!pending && items.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-3 py-10 text-center text-slate-500">
                    No products match these filters.
                  </td>
                </tr>
              ) : null}
              {items.map((product) => {
                const mrp = toNumber(product.price);
                const selling = toNumber(product.sale_price || product.price);
                const busy = busyId === product.id;
                return (
                  <tr key={product.id} className="border-t border-slate-100 align-top">
                    <td className="sticky left-0 z-10 bg-white px-3 py-3">
                      <ProductThumb product={product} />
                    </td>
                    <td className="sticky left-14 z-10 bg-white px-3 py-3">
                      <p className="max-w-40 font-medium text-slate-950">{product.name}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{product.sku}</td>
                    <td className="px-3 py-3 text-slate-600">{product.category?.name || "—"}</td>
                    <td className="px-3 py-3 text-slate-600">{product.brand?.name || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-900">{formatInr(selling)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatInr(mrp)}</td>
                    <td className="px-3 py-3 text-slate-600">{formatGst(product.gst_percentage)}</td>
                    <td className="px-3 py-3">
                      <StockCell quantity={product.stock_quantity} />
                    </td>
                    <td className="px-3 py-3">
                      <FlagsCell product={product} />
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          product.is_published
                            ? "text-[11px] font-semibold tracking-[0.08em] text-slate-800 uppercase"
                            : "text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase"
                        }
                      >
                        {product.is_published ? "Published" : "Unpublished"}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                      {formatCreatedDate(product.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1 text-sm">
                        <a
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sky-700 hover:text-sky-800"
                        >
                          View
                        </a>
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="font-medium text-sky-700 hover:text-sky-800"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void togglePublish(product)}
                          className="font-medium text-sky-700 hover:text-sky-800 disabled:opacity-50"
                        >
                          {product.is_published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeProduct(product)}
                          className="font-medium text-slate-700 hover:text-rose-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {count > 20 ? (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page * 20 >= count}
            onClick={() => setPage((value) => value + 1)}
            className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  emptyLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  emptyLabel: string;
  options: Array<{ id: number; name: string }>;
}) {
  const fieldId = `admin-filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const fieldName = label.toLowerCase().replace(/\s+/g, "_");
  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <select
        id={fieldId}
        name={fieldName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        className={SELECT_CLASS}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductThumb({ product }: { product: StaffProduct }) {
  const src = resolveMediaUrl(product.primary_image?.url);
  if (!src) {
    return (
      <div className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-[10px] leading-tight text-slate-400">
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={product.primary_image?.alt_text || product.name}
      className="size-11 rounded-lg object-cover"
    />
  );
}

function StockCell({ quantity }: { quantity: number }) {
  if (quantity <= 0) {
    return (
      <div>
        <p className="font-medium text-slate-900">0</p>
        <p className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
          <span className="size-1.5 rounded-full bg-rose-500" />
          Out of stock
        </p>
      </div>
    );
  }
  const low = quantity <= 5;
  return (
    <div>
      <p className="font-medium text-slate-900">{quantity}</p>
      <p
        className={
          low
            ? "inline-flex items-center gap-1 text-xs font-semibold text-amber-600"
            : "inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"
        }
      >
        <span className={`size-1.5 rounded-full ${low ? "bg-amber-500" : "bg-emerald-500"}`} />
        {low ? "Low stock" : "In stock"}
      </p>
    </div>
  );
}

function FlagsCell({ product }: { product: StaffProduct }) {
  const flags = [
    product.is_featured ? "Featured" : null,
    product.is_best_seller ? "Bestseller" : null,
  ].filter(Boolean);
  if (flags.length === 0) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {flags.map((flag) => (
        <span key={flag} className="text-xs font-medium text-slate-700">
          {flag}
        </span>
      ))}
    </div>
  );
}

function formatGst(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "—";
  }
  return `${Number.isInteger(amount) ? amount : amount.toFixed(2)}%`;
}

function formatCreatedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}
