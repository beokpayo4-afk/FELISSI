import { Link } from "react-router-dom";
import { MoneyBreakdown } from "@/components/shop/MoneyBreakdown";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CartTotals } from "@/types/cart";

export function CartSummary({
  totals,
  checkoutTo,
}: {
  totals: CartTotals;
  checkoutTo: string;
}) {
  return (
    <aside className="card p-5 lg:sticky lg:top-28">
      <h2 className="text-lg font-semibold text-ink">Order summary</h2>
      <div className="mt-4">
        <MoneyBreakdown totals={totals} />
      </div>

      <p className="mt-3 text-xs leading-5 text-muted">
        Totals are calculated by the server. Prices on this page are a quote and are rechecked at
        checkout.
      </p>

      <div className="mt-5 grid gap-3">
        <Link
          to={checkoutTo}
          className={cn(
            buttonVariants.primary,
            "h-12",
            totals.itemCount === 0 && "pointer-events-none bg-line text-muted",
          )}
        >
          Checkout
        </Link>
        <Link to="/shop" className={cn(buttonVariants.secondary, "h-11")}>
          Continue shopping
        </Link>
      </div>
    </aside>
  );
}
