import { TriangleAlert } from "lucide-react";

export function ShopErrorState({
  message,
  onRetry,
  title = "Unable to load products",
}: {
  message: string;
  onRetry: () => void;
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-rose-700">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-lg font-semibold text-rose-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-800">{message}</p>
      <button type="button" onClick={onRetry} className="btn btn-danger mt-6">
        Try again
      </button>
    </div>
  );
}
