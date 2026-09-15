import { BenefitsSection } from "@/components/home/BenefitsSection";
import { CategoryCard } from "@/components/home/CategoryCard";
import { HeroBanner } from "@/components/home/HeroBanner";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { ProductGrid } from "@/components/home/ProductGrid";
import { PromoBanner } from "@/components/home/PromoBanner";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeader } from "@/components/home/SectionHeader";
import { ProductGridSkeleton } from "@/components/shop/ProductCardSkeleton";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import { featuredCategories } from "@/data/home";
import { useShopProducts } from "@/hooks/useShopProducts";
import type { CatalogProduct } from "@/types/catalog";

export function HomePage() {
  const bestSellers = useShopProducts({ best_seller: "true" });
  const newArrivals = useShopProducts({ ordering: "-created_at" });
  const catalogFallback = useShopProducts({});

  const bestSellerProducts = pickProducts(bestSellers, catalogFallback, 8);
  const newArrivalProducts = pickProducts(newArrivals, catalogFallback, 8);
  const categories = withLiveCategoryImages(
    featuredCategories,
    catalogFallback.status === "ready" ? catalogFallback.products : [],
  );

  return (
    <div>
      <HeroBanner />

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:px-6 sm:py-20">
        <section>
          <Reveal>
            <SectionHeader eyebrow="Browse" title="Shop by category" actionTo="/shop" />
          </Reveal>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {categories.map((category, index) => (
              <Reveal key={category.id} as="li" delay={index * 80}>
                <CategoryCard category={category} />
              </Reveal>
            ))}
          </ul>
        </section>

        <section>
          <Reveal>
            <SectionHeader
              eyebrow="Most loved"
              title="Best sellers"
              actionTo="/shop?best_seller=true"
            />
          </Reveal>
          <HomeProductSection state={bestSellerProducts} onRetry={bestSellers.reload} />
        </section>
      </div>

      <Reveal>
        <PromoBanner
          title="Under ₹1,000 tech refresh"
          copy="Cables, earbuds, hubs, and power accessories picked for everyday use."
          to="/shop"
          actionLabel="Shop the edit"
        />
      </Reveal>

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:px-6 sm:py-20">
        <section>
          <Reveal>
            <SectionHeader
              eyebrow="Just in"
              title="New arrivals"
              actionTo="/shop?ordering=-created_at"
            />
          </Reveal>
          <HomeProductSection state={newArrivalProducts} onRetry={newArrivals.reload} />
        </section>

        <Reveal>
          <BenefitsSection />
        </Reveal>
      </div>

      <Reveal>
        <NewsletterSection />
      </Reveal>
    </div>
  );
}

type SectionState =
  | { status: "loading" }
  | { status: "ready"; products: CatalogProduct[] }
  | { status: "empty" }
  | { status: "error"; message: string };

function HomeProductSection({
  state,
  onRetry,
}: {
  state: SectionState;
  onRetry: () => void;
}) {
  if (state.status === "loading") {
    return <ProductGridSkeleton count={4} />;
  }
  if (state.status === "error") {
    return (
      <ShopErrorState
        title="Unable to load products"
        message={state.message}
        onRetry={onRetry}
      />
    );
  }
  if (state.status === "empty") {
    return <p className="text-sm text-muted">No products in this section yet.</p>;
  }
  return <ProductGrid products={state.products} animate />;
}

function withLiveCategoryImages(
  categories: (typeof featuredCategories)[number][],
  products: CatalogProduct[],
) {
  return categories.map((category) => {
    const product = products.find((item) => item.category === category.id);
    if (!product?.image || product.image.includes("/placeholders/")) {
      return category;
    }
    return { ...category, image: product.image };
  });
}

function pickProducts(
  primary: ReturnType<typeof useShopProducts>,
  fallback: ReturnType<typeof useShopProducts>,
  limit: number,
): SectionState {
  if (primary.status === "loading" || (primary.status === "empty" && fallback.status === "loading")) {
    return { status: "loading" };
  }
  if (primary.status === "ready" && primary.products.length) {
    return { status: "ready", products: primary.products.slice(0, limit) };
  }
  if (fallback.status === "ready" && fallback.products.length) {
    return { status: "ready", products: fallback.products.slice(0, limit) };
  }
  if (primary.status === "error" && fallback.status !== "ready") {
    return { status: "error", message: primary.message };
  }
  return { status: "empty" };
}
