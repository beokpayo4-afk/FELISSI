import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { useAuth } from "@/store/AuthContext";

export function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
