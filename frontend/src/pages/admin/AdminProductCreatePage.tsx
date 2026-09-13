import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import {
  createStaffProduct,
  fetchStaffOptions,
  fetchStaffProduct,
  patchStaffProduct,
  uploadStaffProductImage,
} from "@/api/staff";
import { ProductImageGallery } from "@/components/admin/ProductImageGallery";
import type { StaffOptions, StaffProduct, StaffProductImage } from "@/types/staff";

export function AdminProductCreatePage() {
  return <AdminProductFormPage />;
}

export function AdminProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const [options, setOptions] = useState<StaffOptions | null>(null);
  const [product, setProduct] = useState<StaffProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<StaffProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    document.title = isEdit ? "Edit product · FELISSI admin" : "Add product · FELISSI admin";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [isEdit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchStaffOptions(), productId ? fetchStaffProduct(productId) : Promise.resolve(null)])
      .then(([nextOptions, nextProduct]) => {
        if (cancelled) {
          return;
        }
        setOptions(nextOptions);
        setProduct(nextProduct);
        setCategoryId(nextProduct ? String(nextProduct.category.id) : "");
        setImages(nextProduct?.images ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const subcategories = useMemo(() => {
    if (!options || !categoryId) {
      return [];
    }
    return options.subcategories.filter((item) => String(item.category) === categoryId);
  }, [options, categoryId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setFields({});
    const sale = String(form.get("sale_price") || "").trim();
    const payload = {
      name: String(form.get("name") || "").trim(),
      sku: String(form.get("sku") || "").trim(),
      short_description: String(form.get("short_description") || "").trim(),
      description: String(form.get("description") || "").trim(),
      brand: Number(form.get("brand")),
      category: Number(form.get("category")),
      subcategory: Number(form.get("subcategory")),
      price: String(form.get("price") || "").trim(),
      sale_price: sale || null,
      gst_percentage: String(form.get("gst_percentage") || "18").trim(),
      stock_quantity: Number(form.get("stock_quantity") || 0),
      is_published: form.get("is_published") === "on",
      is_featured: form.get("is_featured") === "on",
      is_best_seller: form.get("is_best_seller") === "on",
      image_url: String(form.get("image_url") || "").trim() || undefined,
    };
    try {
      if (productId) {
        await patchStaffProduct(productId, payload);
      } else {
        const created = await createStaffProduct(payload);
        try {
          for (const file of pendingFiles) {
            await uploadStaffProductImage(created.id, file, { altText: file.name });
          }
        } catch (uploadErr) {
          setError(getApiErrorMessage(uploadErr));
          navigate(`/admin/products/${created.id}/edit`, { replace: true });
          return;
        }
      }
      navigate("/admin/products", { replace: true });
    } catch (err) {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {isEdit ? "Edit product" : "Add product"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update this item in the FELISSI catalogue." : "Publish electronics to the FELISSI catalogue."}
        </p>
      </div>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      {loading ? <p className="text-sm text-slate-500">Loading form…</p> : null}

      {!loading && options && (!isEdit || product) ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <Field label="Name" name="name" error={fields.name} required defaultValue={product?.name} />
          <Field label="SKU" name="sku" error={fields.sku} required defaultValue={product?.sku} />
          <Field
            label="Short description"
            name="short_description"
            error={fields.short_description}
            required
            defaultValue={product?.short_description}
          />
          <label htmlFor="description" className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              defaultValue={product?.description}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            {fields.description ? <span className="mt-1 block text-sm text-rose-700">{fields.description}</span> : null}
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Brand"
              name="brand"
              error={fields.brand}
              options={options.brands}
              defaultValue={product ? String(product.brand.id) : ""}
            />
            <Select
              label="Category"
              name="category"
              error={fields.category}
              options={options.categories}
              defaultValue={product ? String(product.category.id) : ""}
              onChange={setCategoryId}
            />
            <Select
              label="Subcategory"
              name="subcategory"
              error={fields.subcategory}
              options={subcategories}
              defaultValue={product ? String(product.subcategory.id) : ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="MRP (₹)"
              name="price"
              type="number"
              step="0.01"
              error={fields.price}
              required
              defaultValue={product?.price}
            />
            <Field
              label="Selling price (₹)"
              name="sale_price"
              type="number"
              step="0.01"
              error={fields.sale_price}
              defaultValue={product?.sale_price ?? ""}
            />
            <Field
              label="GST % for this product"
              name="gst_percentage"
              type="number"
              step="0.01"
              defaultValue={product?.gst_percentage ?? "18"}
              error={fields.gst_percentage}
            />
          </div>
          <p className="text-xs text-slate-500">
            Set this product&apos;s GST rate. Inclusive vs exclusive pricing is a store setting, not a
            single catalog-wide GST percentage.
          </p>
          <Field
            label="Stock"
            name="stock_quantity"
            type="number"
            defaultValue={product ? String(product.stock_quantity) : "0"}
            error={fields.stock_quantity}
            required
          />
          {isEdit && productId ? (
            <ProductImageGallery productId={productId} images={images} onChange={setImages} />
          ) : (
            <div className="space-y-3">
              <label htmlFor="product_images" className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Product images</span>
                <input
                  id="product_images"
                  name="product_images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(event) => setPendingFiles(Array.from(event.target.files ?? []))}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-700"
                />
                {pendingFiles.length ? (
                  <span className="mt-1 block text-xs text-slate-500">
                    {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"} will upload after the product is saved.
                  </span>
                ) : null}
              </label>
              <Field label="Or paste image URL" name="image_url" error={fields.image_url} />
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label htmlFor="is_published" className="inline-flex items-center gap-2">
              <input
                id="is_published"
                type="checkbox"
                name="is_published"
                defaultChecked={product?.is_published ?? true}
              />
              Published
            </label>
            <label htmlFor="is_featured" className="inline-flex items-center gap-2">
              <input
                id="is_featured"
                type="checkbox"
                name="is_featured"
                defaultChecked={product?.is_featured ?? false}
              />
              Featured
            </label>
            <label htmlFor="is_best_seller" className="inline-flex items-center gap-2">
              <input
                id="is_best_seller"
                type="checkbox"
                name="is_best_seller"
                defaultChecked={product?.is_best_seller ?? false}
              />
              Best seller
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Save product"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  error,
  type = "text",
  required,
  step,
  defaultValue,
}: {
  label: string;
  name: string;
  error?: string;
  type?: string;
  required?: boolean;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />
      {error ? <span className="mt-1 block text-sm text-rose-700">{error}</span> : null}
    </label>
  );
}

function Select({
  label,
  name,
  options,
  error,
  onChange,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Array<{ id: number; name: string }>;
  error?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
}) {
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        id={name}
        name={name}
        required
        defaultValue={defaultValue}
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-sm text-rose-700">{error}</span> : null}
    </label>
  );
}
