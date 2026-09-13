import { useRef, useState, type ChangeEvent } from "react";
import {
  addStaffProductImageUrl,
  deleteStaffProductImage,
  patchStaffProductImage,
  uploadStaffProductImage,
} from "@/api/staff";
import { getApiErrorMessage } from "@/api/errors";
import type { StaffProductImage } from "@/types/staff";

type ProductImageGalleryProps = {
  productId: string;
  images: StaffProductImage[];
  onChange: (images: StaffProductImage[]) => void;
};

export function ProductImageGallery({ productId, images, onChange }: ProductImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      let next = images;
      for (const file of files) {
        const created = await uploadStaffProductImage(productId, file, { altText: file.name });
        next = [...next, created];
      }
      onChange(next);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleUrlAdd() {
    const url = urlValue.trim();
    if (!url) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const created = await addStaffProductImageUrl(productId, url);
      onChange([...images, created]);
      setUrlValue("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(image: StaffProductImage) {
    if (!window.confirm("Delete this product image?")) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await deleteStaffProductImage(productId, image.id);
      const remaining = images.filter((item) => item.id !== image.id);
      if (image.is_primary && remaining[0] && !remaining[0].is_primary) {
        remaining[0] = { ...remaining[0], is_primary: true };
      }
      onChange(remaining);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handlePrimary(image: StaffProductImage) {
    setPending(true);
    setError(null);
    try {
      const updated = await patchStaffProductImage(productId, image.id, { is_primary: true });
      onChange(images.map((item) => ({ ...item, is_primary: item.id === updated.id })));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-700">Product images</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Uploads are optimized to WebP and stored in object storage. PostgreSQL keeps the public URL.
        </p>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {images.length ? (
        <ul className="grid gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <li key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img src={image.url} alt={image.alt_text || "Product image"} className="h-32 w-full object-cover" />
              <div className="flex flex-wrap items-center gap-2 p-2 text-xs">
                {image.is_primary ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-800">Primary</span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void handlePrimary(image)}
                    className="text-sky-700 hover:underline disabled:opacity-50"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void handleDelete(image)}
                  className="ml-auto text-rose-700 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          No images yet. Upload files or paste a public URL.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor="gallery-upload-images" className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Upload images</span>
          <input
            id="gallery-upload-images"
            name="gallery_images"
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={pending}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              if (event.target.files) {
                void uploadFiles(event.target.files);
              }
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-700"
          />
        </label>
        <label htmlFor="gallery-image-url" className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Or paste image URL</span>
          <div className="flex gap-2">
            <input
              id="gallery-image-url"
              name="image_url"
              value={urlValue}
              onChange={(event) => setUrlValue(event.target.value)}
              placeholder="https://"
              disabled={pending}
              autoComplete="url"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
            <button
              type="button"
              disabled={pending || !urlValue.trim()}
              onClick={() => void handleUrlAdd()}
              className="h-11 shrink-0 rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </label>
      </div>
    </div>
  );
}
