import { Heart, ShoppingBag, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Container } from "@/components/layout/Container";
import { ProductDetailSkeleton } from "@/components/product/ProductDetailSkeleton";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import { useProductDetail } from "@/hooks/useProductDetail";
import { toNumber } from "@/lib/catalog";
import { discountPercent, formatInr, formatInrMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/CartContext";
import { useShop } from "@/store/ShopContext";

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const detail = useProductDetail(slug);
  const { toggleWishlist, wishlistIds } = useShop();
  const { addItem, busy, actionError } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addMessage, setAddMessage] = useState<string | null>(null);

  useEffect(() => {
    setQuantity(1);
  }, [slug]);

  useEffect(() => {
    if (detail.status === "ready") {
      document.title = `${detail.product.name} · FELISSI`;
    }
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [detail]);

  if (detail.status === "loading") {
    return (
      <Container className="py-8">
        <ProductDetailSkeleton />
      </Container>
    );
  }

  if (detail.status === "not_found") {
    return (
      <Container className="space-y-3 py-10">
        <h1 className="page-title">Product not found</h1>
        <p className="page-lede">This listing is unpublished or the link is incorrect.</p>
        <Link to="/shop" className="link-brand mt-3 inline-block text-sm">
          Back to shop
        </Link>
      </Container>
    );
  }

  if (detail.status === "error") {
    return (
      <Container className="py-10">
        <ShopErrorState
          title="Unable to load this product"
          message={detail.message}
          onRetry={detail.reload}
        />
      </Container>
    );
  }

  const { product, reviews, related } = detail;
  const price = toNumber(product.price);
  const sale = product.sale_price == null ? undefined : toNumber(product.sale_price);
  const off = discountPercent(price, sale);
  const inStock = product.stock_quantity > 0;
  const wished = wishlistIds.includes(product.id);
  const images = [...product.images].sort((a, b) => a.sort_order - b.sort_order);
  const rating = toNumber(product.average_rating);

  function handleAdd() {
    if (!inStock) {
      return;
    }
    setAddMessage(null);
    void addItem(product.id, quantity)
      .then(() => setAddMessage("Added to cart"))
      .catch(() => setAddMessage(null));
  }

  async function handleBuy() {
    if (!inStock) {
      return;
    }
    setAddMessage(null);
    try {
      await addItem(product.id, quantity);
      navigate("/cart");
    } catch {
      // CartContext already surfaces the API error.
    }
  }

  return (
    <Container className="space-y-12 py-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <ProductGallery images={images} productName={product.name} />

        <div>
          <p className="text-sm font-medium text-sky-700">
            <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
            {product.brand ? ` · ${product.brand.name}` : null}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {rating.toFixed(1)} rating · {product.review_count} reviews · SKU {product.sku}
          </p>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold text-ink">{formatInr(sale ?? price)}</span>
            {sale ? <span className="text-lg text-slate-400 line-through">{formatInr(price)}</span> : null}
            {off ? (
              <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                {off}% off
              </span>
            ) : null}
          </div>
          <div className="mt-2 space-y-1 text-sm text-muted">
            {product.gst_inclusive ? (
              <p>
                Inclusive of {toNumber(product.gst_percentage)}% GST (
                {formatInrMoney(toNumber(product.gst_amount))})
              </p>
            ) : (
              <>
                <p>
                  Exclusive of GST. Add {formatInrMoney(toNumber(product.gst_amount))} (
                  {toNumber(product.gst_percentage)}%) at checkout.
                </p>
                <p>Price with GST: {formatInrMoney(toNumber(product.inclusive_price))}</p>
              </>
            )}
          </div>
          <p className={cn("mt-2 text-sm font-medium", inStock ? "text-emerald-700" : "text-rose-700")}>
            {inStock ? `In stock · ${product.stock_quantity} available` : "Out of stock"}
          </p>

          <p className="mt-4 text-sm leading-7 text-muted">{product.short_description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantitySelector
              id="product-quantity"
              name="quantity"
              value={quantity}
              max={Math.max(1, product.stock_quantity)}
              onChange={setQuantity}
              disabled={!inStock}
            />
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
                wished
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-800 hover:border-sky-300",
              )}
              aria-pressed={wished}
            >
              <Heart className={cn("size-4", wished && "fill-current")} />
              Wishlist
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock || busy}
              className="btn btn-primary h-12"
            >
              <ShoppingCart className="size-4" />
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => void handleBuy()}
              disabled={!inStock || busy}
              className="btn btn-secondary h-12 border-forest text-forest hover:bg-cream"
            >
              <ShoppingBag className="size-4" />
              Buy now
            </button>
          </div>
          {addMessage ? <p className="mt-3 text-sm text-forest-600">{addMessage}</p> : null}
          {actionError ? <p className="mt-3 text-sm text-rose-700">{actionError}</p> : null}
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-ink">Product description</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted sm:text-base">
          {product.description}
        </p>
      </section>

      <ProductSpecs product={product} />
      <ProductReviews reviews={reviews} />

      {related.length ? (
        <section>
          <h2 className="text-xl font-semibold text-ink">Related products</h2>
          <div className="mt-4">
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}
    </Container>
  );
}
