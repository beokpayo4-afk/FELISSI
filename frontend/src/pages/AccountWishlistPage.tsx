import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "@/components/home/ProductCard";
import { useShop } from "@/store/ShopContext";

export function AccountWishlistPage() {
  const { wishlistItems, wishlistReady, wishlistCount } = useShop();

  useEffect(() => {
    document.title = "Wishlist · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Wishlist</h1>
      <p className="mt-2 text-sm text-slate-600">
        Saved items stay on your account. Guest saves are copied over when you sign in.
      </p>

      {!wishlistReady ? <div className="mt-6 h-48 animate-pulse rounded-2xl bg-slate-200" /> : null}

      {wishlistReady && wishlistCount === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          Nothing saved yet.{" "}
          <Link to="/shop" className="font-medium text-sky-700 hover:text-sky-800">
            Browse the shop
          </Link>
        </p>
      ) : null}

      {wishlistReady && wishlistItems.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wishlistItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}

      {wishlistReady && wishlistCount > 0 && wishlistItems.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          {wishlistCount} saved {wishlistCount === 1 ? "item" : "items"}. Open a product page to see details, or
          sign in again if this list looks incomplete.
        </p>
      ) : null}
    </section>
  );
}
