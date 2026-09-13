import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { Container } from "@/components/layout/Container";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import { useAuth } from "@/store/AuthContext";
import { useCart } from "@/store/CartContext";

export function CartPage() {
  const { isAuthenticated } = useAuth();
  const cart = useCart();

  useEffect(() => {
    document.title = "Cart · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  const checkoutTo = isAuthenticated ? "/checkout" : "/login?next=/checkout";

  return (
    <Container className="py-8">
      <h1 className="page-title">Shopping cart</h1>
      <p className="page-lede">
        {isAuthenticated
          ? "Your bag is saved to your account."
          : "Guest items stay on this device and move to your account after you sign in."}
      </p>

      {cart.status === "loading" ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-64 animate-pulse rounded-2xl bg-line" />
          <div className="h-80 animate-pulse rounded-2xl bg-line" />
        </div>
      ) : null}

      {cart.status === "error" ? (
        <div className="mt-8">
          <ShopErrorState
            title="Unable to load your cart"
            message={cart.actionError || "The cart quote could not be calculated."}
            onRetry={() => void cart.reload()}
          />
        </div>
      ) : null}

      {cart.status === "ready" && cart.items.length === 0 ? (
        <section className="card mt-10 px-6 py-12 text-center">
          <h2 className="text-xl font-semibold text-ink">Your bag is empty</h2>
          <p className="mt-2 text-muted">Add electronics from the shop to see a server-priced quote here.</p>
          {cart.actionError ? <p className="mt-3 text-sm text-rose-700">{cart.actionError}</p> : null}
          <Link to="/shop" className="btn btn-primary mt-6">
            Continue shopping
          </Link>
        </section>
      ) : null}

      {cart.status === "ready" && cart.items.length > 0 ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section className="card px-4 sm:px-6">
            {cart.actionError ? <p className="pt-4 text-sm text-rose-700">{cart.actionError}</p> : null}
            {cart.items.map((item) => (
              <CartItemRow
                key={item.key}
                item={item}
                disabled={cart.busy}
                onQuantity={(quantity) => void cart.setQuantity(item.key, quantity)}
                onRemove={() => void cart.removeItem(item.key)}
              />
            ))}
          </section>
          <CartSummary totals={cart.totals} checkoutTo={checkoutTo} />
        </div>
      ) : null}
    </Container>
  );
}
