import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function IconLink({
  to,
  label,
  icon: Icon,
  count,
  compact = false,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "relative inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 text-muted transition-colors hover:bg-cream hover:text-ink",
        compact && "px-2",
      )}
    >
      <span className="relative">
        <Icon className="size-5" aria-hidden="true" />
        {count ? (
          <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </span>
      <span className={cn("text-sm font-medium", compact && "sr-only")}>{label}</span>
    </Link>
  );
}
