import { ProductCard } from "@/components/home/ProductCard";
import { Reveal } from "@/components/home/Reveal";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/types/catalog";

export function ProductGrid({
  products,
  layout = "home",
  animate = false,
}: {
  products: CatalogProduct[];
  layout?: "home" | "shop";
  animate?: boolean;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4",
        layout === "home" ? "md:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-2 xl:grid-cols-3",
      )}
    >
      {products.map((product, index) =>
        animate ? (
          <Reveal key={product.id} as="li" delay={index * 70}>
            <ProductCard product={product} />
          </Reveal>
        ) : (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ),
      )}
    </ul>
  );
}
