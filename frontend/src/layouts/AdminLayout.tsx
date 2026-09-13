import { Bell, LayoutDashboard, LogOut, PackagePlus, Settings2, ShoppingBag, Store, Tags } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/AuthContext";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Tags, end: true },
  { to: "/admin/products/new", label: "Add product", icon: PackagePlus, end: false },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, end: false },
  { to: "/admin/settings", label: "Settings", icon: Settings2, end: false },
  { to: "/admin/storefront", label: "Storefront", icon: Store, end: false },
];

export function AdminLayout() {
  const { customer, logout } = useAuth();

  return (
    <div className="min-h-svh bg-[#f6f3ee] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-[#12352c] text-[#e8efe9]">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#2f6f4e] text-sm font-bold text-white">
            V
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">{env.appName}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#9bb8ac]">Admin panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-[#1d4d40] text-white" : "text-[#c5d6ce] hover:bg-white/5 hover:text-white",
                )
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => void logout()}
          className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#c5d6ce] hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Logout
        </button>
      </aside>

      <div className="pl-64">
        <header className="flex items-center justify-between gap-4 border-b border-black/5 bg-[#f6f3ee] px-8 py-5">
          <div>
            <p className="text-sm font-medium text-slate-500">Admin workspace</p>
            <p className="text-sm text-slate-500">Manage catalogue, stock, and store operations</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
              <Bell className="size-4" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1 pr-4 pl-1">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#12352c] text-sm font-semibold text-white">
                {(customer?.full_name || "A").slice(0, 1).toUpperCase()}
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold text-slate-900">
                  {customer?.full_name || "Staff"}
                </span>
                <span className="block text-xs text-slate-500">{customer?.email}</span>
              </span>
            </div>
          </div>
        </header>
        <main className="px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
