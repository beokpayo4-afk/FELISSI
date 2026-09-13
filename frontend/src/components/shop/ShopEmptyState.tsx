import { PackageSearch } from "lucide-react";

export function ShopEmptyState({
  onClear,
  title = "No products match these filters",
  message = "Try a broader search, another category, or clear the current filters.",
  actionLabel = "Clear filters",
}: {
  onClear: () => void;
  title?: string;
  message?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card px-6 py-16 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-cream text-forest">
        <PackageSearch className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-lg font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{message}</p>
      <button type="button" onClick={onClear} className="btn btn-primary mt-6">
        {actionLabel}
      </button>
    </div>
  );
}
