import { Link } from "react-router-dom";
import { company } from "@/constants/company";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label={company.legalName}
    >
      <img
        src="/brand/felissi-logo.png"
        alt={company.legalName}
        className="h-14 w-auto object-contain object-left mix-blend-multiply"
        width={160}
        height={160}
        decoding="async"
      />
    </Link>
  );
}
