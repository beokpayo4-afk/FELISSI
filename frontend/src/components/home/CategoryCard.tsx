import { Link } from "react-router-dom";
import type { CatalogCategory } from "@/types/catalog";

export function CategoryCard({ category }: { category: CatalogCategory }) {
  return (
    <Link to={category.to} className="group block">
      <div className="img-frame aspect-4/5 overflow-hidden">
        <img
          src={category.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
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
