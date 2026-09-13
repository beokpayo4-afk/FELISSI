import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tones = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-900",
} as const;

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p role="status" className={cn("rounded-xl border px-4 py-3 text-sm leading-6", tones[tone], className)}>
      {children}
    </p>
  );
}
