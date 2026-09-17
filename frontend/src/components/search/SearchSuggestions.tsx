import { formatInr } from "@/lib/money";
import { storefrontProductImage, toNumber } from "@/lib/catalog";
import type { SearchSuggestions } from "@/types/catalog";

export function SearchSuggestionsPanel({
  suggestions,
  activeIndex,
  onHover,
  onSelectProduct,
  onSelectBrand,
  onSelectCategory,
}: {
  suggestions: SearchSuggestions;
  activeIndex: number;
  onHover: (index: number) => void;
  onSelectProduct: (slug: string) => void;
  onSelectBrand: (slug: string, name: string) => void;
  onSelectCategory: (slug: string, name: string) => void;
}) {
  const items = suggestionItems(suggestions);
  if (items.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-slate-500">No matching products, brands, or categories.</p>
    );
  }

  return (
    <ul className="max-h-80 overflow-y-auto py-1">
      {items.map((item, index) => (
        <li key={`${item.kind}-${item.slug}`}>
          <button
            type="button"
            onMouseEnter={() => onHover(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (item.kind === "product") onSelectProduct(item.slug);
              if (item.kind === "brand") onSelectBrand(item.slug, item.name);
              if (item.kind === "category") onSelectCategory(item.slug, item.name);
            }}
            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
              index === activeIndex ? "bg-sky-50 text-sky-950" : "text-slate-800 hover:bg-slate-50"
            }`}
          >
            {item.kind === "product" ? (
              <img
                src={item.image}
                alt=""
                className="size-10 rounded-lg object-cover bg-slate-100"
                onError={(event) => {
                  event.currentTarget.src = "/placeholders/product.svg";
                }}
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold uppercase text-slate-500">
                {item.kind === "brand" ? "Brand" : "Cat"}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{item.name}</span>
              <span className="block truncate text-xs text-slate-500">{item.meta}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function suggestionItems(suggestions: SearchSuggestions) {
  const products = suggestions.products.map((product) => ({
    kind: "product" as const,
    slug: product.slug,
    name: product.name,
    meta: `${product.brand.name} · ${product.sku} · ${formatInr(toNumber(product.sale_price ?? product.price))}`,
    image: storefrontProductImage(product.primary_image?.url),
  }));
  const brands = suggestions.brands.map((brand) => ({
    kind: "brand" as const,
    slug: brand.slug,
    name: brand.name,
    meta: "Brand",
    image: "",
  }));
  const categories = suggestions.categories.map((category) => ({
    kind: "category" as const,
    slug: category.slug,
    name: category.name,
    meta: "Category",
    image: "",
  }));
  return [...products, ...brands, ...categories];
}
