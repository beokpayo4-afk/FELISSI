import { Heart, ShoppingCart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { ProductImage } from "@/components/ui/ProductImage";
import { discountPercent, formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/CartContext";
import { useShop } from "@/store/ShopContext";
import type { CatalogProduct } from "@/types/catalog";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { wishlistIds, toggleWishlist } = useShop();
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const wished = wishlistIds.includes(product.id);
  const off = discountPercent(product.price, product.salePrice);

  useEffect(() => {
    if (!feedback || feedback.tone !== "ok") {
      return;
    }
    const timer = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function handleAdd() {
    setFeedback(null);
    setPending(true);
    try {
      await addItem(product.id);
      setFeedback({ tone: "ok", text: "Added to cart" });
    } catch (error) {
      setFeedback({ tone: "error", text: getApiErrorMessage(error) });
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      <div className="img-frame relative aspect-square">
        <Link to={`/product/${product.slug}`} className="block size-full">
          <ProductImage src={product.image} alt={product.imageAlt} />
        </Link>
        {off ? (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white sm:top-3 sm:left-3">
            {off}% off
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className={cn(
            "absolute top-2.5 right-2.5 inline-flex size-10 items-center justify-center rounded-full bg-white/95 shadow-sm sm:top-3 sm:right-3",
            wished ? "text-rose-600" : "text-muted hover:text-rose-600",
          )}
          aria-pressed={wished}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("size-4", wished && "fill-current")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link
          to={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-semibold text-ink hover:text-sky-700 sm:text-base"
        >
          {product.name}
        </Link>
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted sm:text-sm">
          <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span>{product.rating.toFixed(1)}</span>
          <span className="text-slate-400">({product.reviewCount})</span>
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:mt-3">
          <span className="text-base font-semibold text-ink sm:text-lg">
            {formatInr(product.salePrice ?? product.price)}
          </span>
          {product.salePrice ? (
            <span className="text-xs text-slate-400 line-through sm:text-sm">{formatInr(product.price)}</span>
          ) : null}
        </div>
        {product.gstPercentage != null ? (
          <p className="mt-1 text-[11px] text-muted sm:text-xs">
            {product.gstInclusive ? "Incl." : "Excl."} {product.gstPercentage}% GST
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={pending}
          className="btn btn-primary mt-3 min-h-10 w-full px-3 text-xs sm:mt-4 sm:min-h-11 sm:text-sm"
        >
          <ShoppingCart className="size-4" aria-hidden="true" />
          {pending ? "Adding…" : "Add to cart"}
        </button>
        {feedback ? (
          <p
            className={cn(
              "mt-2 text-center text-[11px] sm:text-xs",
              feedback.tone === "ok" ? "text-emerald-700" : "text-rose-700",
            )}
            role="status"
          >
            {feedback.text}
          </p>
        ) : null}
      </div>
    </article>
  );
}
