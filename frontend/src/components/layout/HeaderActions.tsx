import { Heart, Settings, ShoppingCart, User } from "lucide-react";
import { IconLink } from "@/components/ui/IconLink";
import { useAuth } from "@/store/AuthContext";
import { useCart } from "@/store/CartContext";
import { useShop } from "@/store/ShopContext";

export function HeaderActions({ compact = false }: { compact?: boolean }) {
  const { customer } = useAuth();
  const { wishlistCount } = useShop();
  const { totals } = useCart();
  const cartCount = totals.itemCount;

  return (
    <div className="flex items-center gap-0.5">
      {customer?.is_staff ? <IconLink to="/admin" label="Admin" icon={Settings} compact={compact} /> : null}
      <IconLink to={customer?.is_staff ? "/admin" : "/account"} label="Account" icon={User} compact={compact} />
      <IconLink to="/account/wishlist" label="Wishlist" icon={Heart} compact={compact} count={wishlistCount} />
      <IconLink to="/cart" label="Cart" icon={ShoppingCart} compact={compact} count={cartCount} />
    </div>
  );
}
