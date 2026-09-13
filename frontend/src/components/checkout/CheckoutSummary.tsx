import { MoneyBreakdown } from "@/components/shop/MoneyBreakdown";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatInrMoney } from "@/lib/money";
import type { CartLine, CartTotals } from "@/types/cart";

export function CheckoutSummary({
  items,
  totals,
  disabled,
  submitting,
}: {
  items: CartLine[];
  totals: CartTotals;
  disabled?: boolean;
  submitting?: boolean;
}) {
  return (
    <aside className="card p-5 lg:sticky lg:top-28">
      <h2 className="text-lg font-semibold text-ink">Order summary</h2>
      <ul className="mt-4 divide-y divide-line">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 py-3 first:pt-0">
            <div className="img-frame size-14 shrink-0 overflow-hidden rounded-lg">
              <ProductImage src={item.image} alt={item.imageAlt} className="p-1.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
              <p className="text-xs text-muted">
                Qty {item.quantity} · {formatInrMoney(item.unitPrice)}
              </p>
            </div>
            <p className="text-sm font-semibold text-ink">{formatInrMoney(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-2 border-t border-line pt-4">
        <MoneyBreakdown totals={totals} finalLabel="Final total" />
      </div>

      <p className="mt-3 text-xs leading-5 text-muted">
        This is a server quote. Place Order recalculates subtotal, GST, and the payable total on the
        backend.
      </p>

      <button
        type="submit"
        disabled={disabled || submitting || totals.itemCount === 0}
        className="btn btn-primary mt-5 hidden h-12 w-full lg:inline-flex"
      >
        {submitting ? "Placing order…" : `Place order · ${formatInrMoney(totals.total)}`}
      </button>
    </aside>
  );
}
