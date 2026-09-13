import { ChevronLeft, ChevronRight } from "lucide-react";
import { SHOP_PAGE_SIZE } from "@/lib/shopQuery";
import { cn } from "@/lib/utils";

export function ShopPagination({
  page,
  count,
  onPageChange,
}: {
  page: number;
  count: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / SHOP_PAGE_SIZE));
  if (totalPages <= 1) {
    return null;
  }

  const pages = visiblePages(page, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={pageButton(page <= 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((item, index) =>
        item === "…" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={cn(
              pageButton(false),
              item === page && "bg-sky-600 text-white hover:bg-sky-600",
            )}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={pageButton(page >= totalPages)}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

function pageButton(disabled: boolean): string {
  return cn(
    "inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-800",
    disabled ? "cursor-not-allowed opacity-40" : "hover:border-sky-300 hover:text-sky-800",
  );
}

function visiblePages(page: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const items = new Set([1, total, page, page - 1, page + 1]);
  const ordered = [...items].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  for (const value of ordered) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && value - previous > 1) {
      result.push("…");
    }
    result.push(value);
  }
  return result;
}
