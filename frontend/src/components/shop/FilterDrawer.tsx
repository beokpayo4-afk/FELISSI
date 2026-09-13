import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function FilterDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 flex h-dvh w-[min(22rem,92vw)] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <p className="font-semibold text-slate-950">Filters</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Close filter drawer"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">{children}</div>
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Show products
          </button>
        </div>
      </aside>
    </div>
  );
}
