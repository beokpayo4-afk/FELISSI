import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatInrMoney } from "@/lib/money";
import type { CartLine } from "@/types/cart";

export function CartItemRow({
  item,
  disabled,
  onQuantity,
  onRemove,
}: {
  item: CartLine;
  disabled?: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <article className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 border-b border-line py-5 last:border-b-0 sm:grid-cols-[96px_minmax(0,1fr)_auto]">
      <Link to={`/product/${item.slug}`} className="img-frame overflow-hidden rounded-xl">
        <ProductImage src={item.image} alt={item.imageAlt} className="p-2" />
      </Link>

      <div className="min-w-0">
        <Link to={`/product/${item.slug}`} className="font-semibold text-ink hover:text-sky-700">
          {item.name}
        </Link>
        <p className="mt-1 text-sm text-muted">{formatInrMoney(item.unitPrice)} each</p>
        <p className="mt-1 text-base font-semibold text-ink sm:hidden">{formatInrMoney(item.lineTotal)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <QuantitySelector
            id={`cart-qty-${item.key}`}
            name={`quantity_${item.key}`}
            value={item.quantity}
            max={Math.max(1, item.stockQuantity || item.quantity)}
            onChange={onQuantity}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-rose-700 hover:text-rose-800 disabled:opacity-40"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>

      <p className="hidden text-right text-base font-semibold text-ink sm:block">
        {formatInrMoney(item.lineTotal)}
      </p>
    </article>
  );
}
