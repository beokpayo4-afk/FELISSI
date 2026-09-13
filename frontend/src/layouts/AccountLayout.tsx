import { NavLink, Outlet } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

const links = [
  { to: "/account", label: "Overview", end: true },
  { to: "/account/orders", label: "Orders" },
  { to: "/account/profile", label: "Profile" },
  { to: "/account/addresses", label: "Addresses" },
  { to: "/account/wishlist", label: "Wishlist" },
];

export function AccountLayout() {
  return (
    <Container className="py-8">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <nav
          aria-label="Account"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
                  isActive
                    ? "bg-sky-600 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:text-sky-700",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </Container>
  );
}
