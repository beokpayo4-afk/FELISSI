import { Link, useLocation, useSearchParams } from "react-router-dom";
import { categoryNav } from "@/constants/navigation";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

export function CategoryNav() {
  const location = useLocation();
  const [params] = useSearchParams();
  const currentCategory = params.get("category");
  const onShop = location.pathname === "/shop";

  return (
    <nav className="hidden border-t border-line bg-white lg:block" aria-label="Categories">
      <Container className="flex h-12 items-center gap-1 overflow-x-auto">
        <CategoryLink to="/shop" active={onShop && !currentCategory}>
          Shop all
        </CategoryLink>
        {categoryNav.map((item) => {
          const slug = new URLSearchParams(item.to.split("?")[1]).get("category");
          return (
            <CategoryLink key={item.to} to={item.to} active={onShop && currentCategory === slug}>
              {item.label}
            </CategoryLink>
          );
        })}
      </Container>
    </nav>
  );
}

function CategoryLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "shrink-0 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "border-sky-600 text-sky-800"
          : "border-transparent text-muted hover:border-line hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
