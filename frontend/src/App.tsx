import { AppRouter } from "@/routes";
import { AuthProvider } from "@/store/AuthContext";
import { CartProvider } from "@/store/CartContext";
import { ShopProvider } from "@/store/ShopContext";

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </ShopProvider>
    </AuthProvider>
  );
}
