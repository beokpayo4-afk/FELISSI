import { Menu, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/store/CartContext";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { Logo } from "@/components/layout/Logo";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { SearchBar } from "@/components/layout/SearchBar";
import { Container } from "@/components/layout/Container";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totals } = useCart();
  const cartCount = totals.itemCount;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <Container className="hidden items-center gap-6 py-2 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Logo className="[&_img]:h-19" />
        <SearchBar className="mx-auto w-full max-w-xl" inputId="desktop-search" />
        <HeaderActions />
      </Container>
      <CategoryNav />

      <Container className="flex flex-col gap-3 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="btn-icon"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <Logo className="[&_img]:h-14" />
          <Link to="/cart" className="btn-icon relative" aria-label="Cart">
            <ShoppingCart className="size-5" />
            {cartCount ? (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-semibold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
        <SearchBar inputId="mobile-search" />
      </Container>

      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
