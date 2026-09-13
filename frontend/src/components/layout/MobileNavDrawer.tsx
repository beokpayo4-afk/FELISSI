import { Heart, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { categoryNav, companyNav, helpNav, shopNav } from "@/constants/navigation";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

export function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    const first = focusables()[0];
    first?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusables();
      if (!items.length) {
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-forest/40"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
        className="absolute inset-y-0 left-0 flex h-dvh w-[min(20.5rem,88vw)] flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p id="mobile-nav-title" className="sr-only">
              Store menu
            </p>
            <Logo />
          </div>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="Close navigation">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavGroup title="Shop" items={[{ label: "Home", to: "/" }, ...shopNav]} onClose={onClose} />
          <NavGroup title="Categories" items={categoryNav} onClose={onClose} />
          <NavGroup title="Company" items={companyNav} onClose={onClose} />
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-line p-3">
          <QuickLink to="/account" label="Account" icon={User} onClose={onClose} />
          <QuickLink to="/account/wishlist" label="Wishlist" icon={Heart} onClose={onClose} />
          <QuickLink to="/cart" label="Cart" icon={ShoppingCart} onClose={onClose} />
        </div>
        <div className="border-t border-line px-4 py-3">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">Help</p>
          <ul className="mt-2 space-y-1">
            {helpNav.map((item) => (
              <li key={`${item.to}-${item.label}`}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className="block min-h-11 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-cream"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function QuickLink({
  to,
  label,
  icon: Icon,
  onClose,
}: {
  to: string;
  label: string;
  icon: typeof User;
  onClose: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl bg-cream text-xs font-semibold text-ink"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

function NavGroup({
  title,
  items,
  onClose,
}: {
  title: string;
  items: Array<{ label: string; to: string }>;
  onClose: () => void;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted uppercase">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={`${item.to}-${item.label}`}>
            <NavLink
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "block min-h-11 rounded-xl px-3 py-2.5 text-sm font-medium",
                  isActive ? "bg-sky-50 text-sky-800" : "text-ink hover:bg-cream",
                )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
