import { Link } from "react-router-dom";
import { resolveMediaUrl } from "@/lib/env";
import type { CatalogCategory } from "@/types/catalog";

export function CategoryCard({ category }: { category: CatalogCategory }) {
  const src = resolveMediaUrl(category.image) || category.image;
  return (
    <Link to={category.to} className="group block">
      <div className="img-frame aspect-4/5 overflow-hidden">
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-contain bg-white p-4 transition-transform duration-500 ease-out group-hover:scale-[1.04] sm:p-6"
          onError={(event) => {
            event.currentTarget.src = "/placeholders/product.svg";
          }}
        />
      </div>
      <div className="mt-3">
        <h3 className="font-display text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-sky-700">
          {category.name}
        </h3>
        <p className="mt-1 text-sm text-muted">{category.description}</p>
      </div>
    </Link>
  );
}
