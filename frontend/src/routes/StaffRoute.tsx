import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { useAuth } from "@/store/AuthContext";

export function StaffRoute() {
  const { status, isAuthenticated, customer } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!customer?.is_staff) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
