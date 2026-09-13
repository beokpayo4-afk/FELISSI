import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { safeNextPath } from "@/lib/navigation";
import { useAuth } from "@/store/AuthContext";

export function GuestOnlyRoute() {
  const { status, isAuthenticated, customer } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    const fallback = customer?.is_staff ? "/admin" : "/account";
    return <Navigate to={safeNextPath(searchParams.get("next"), fallback)} replace />;
  }

  return <Outlet />;
}
