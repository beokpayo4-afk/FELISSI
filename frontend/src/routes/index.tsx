import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AccountLayout } from "@/layouts/AccountLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { RootLayout } from "@/layouts/RootLayout";
import { AboutPage } from "@/pages/AboutPage";
import { AccountAddressesPage } from "@/pages/AccountAddressesPage";
import { AccountOrderDetailPage } from "@/pages/AccountOrderDetailPage";
import { AccountOrdersPage } from "@/pages/AccountOrdersPage";
import { AccountPage } from "@/pages/AccountPage";
import { AccountProfilePage } from "@/pages/AccountProfilePage";
import { AccountWishlistPage } from "@/pages/AccountWishlistPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { ContactPage } from "@/pages/ContactPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { HomePage } from "@/pages/HomePage";
import { InvoicePage } from "@/pages/InvoicePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OrderConfirmationPage } from "@/pages/OrderConfirmationPage";
import { PolicyPage } from "@/pages/PolicyPage";
import { ProductPage } from "@/pages/ProductPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SearchPage } from "@/pages/SearchPage";
import { ShopPage } from "@/pages/ShopPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminOrderDetailPage } from "@/pages/admin/AdminOrderDetailPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { AdminProductCreatePage, AdminProductFormPage } from "@/pages/admin/AdminProductCreatePage";
import { AdminProductsPage } from "@/pages/admin/AdminProductsPage";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";
import { AdminStorefrontPage } from "@/pages/admin/AdminStorefrontPage";
import { GuestOnlyRoute } from "@/routes/GuestOnlyRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { StaffRoute } from "@/routes/StaffRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StaffRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductCreatePage />} />
            <Route path="products/:productId/edit" element={<AdminProductFormPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:orderNumber/invoice" element={<InvoicePage mode="staff" />} />
            <Route path="orders/:orderNumber" element={<AdminOrderDetailPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="storefront" element={<AdminStorefrontPage />} />
          </Route>
        </Route>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PolicyPage slug="privacy" />} />
          <Route path="terms" element={<PolicyPage slug="terms" />} />
          <Route path="refund" element={<PolicyPage slug="refund" />} />
          <Route path="shipping" element={<PolicyPage slug="shipping" />} />
          <Route path="cart" element={<CartPage />} />

          <Route element={<GuestOnlyRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<AccountPage />} />
              <Route path="orders" element={<AccountOrdersPage />} />
              <Route path="orders/:id" element={<AccountOrderDetailPage />} />
              <Route path="orders/:id/invoice" element={<InvoicePage />} />
              <Route path="profile" element={<AccountProfilePage />} />
              <Route path="addresses" element={<AccountAddressesPage />} />
              <Route path="wishlist" element={<AccountWishlistPage />} />
            </Route>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order/:orderNumber" element={<OrderConfirmationPage />} />
          </Route>

          <Route path="wishlist" element={<Navigate to="/account/wishlist" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
