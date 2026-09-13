import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "slate" | "amber" | "rose" | "emerald";
}) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
        </div>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            tone === "amber" && "bg-amber-50 text-amber-600",
            tone === "rose" && "bg-rose-50 text-rose-600",
            tone === "emerald" && "bg-emerald-50 text-emerald-600",
            tone === "slate" && "bg-slate-100 text-slate-600",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
