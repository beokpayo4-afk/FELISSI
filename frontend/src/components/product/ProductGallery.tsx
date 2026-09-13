import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/utils";
import type { ApiProductImage } from "@/types/catalog";

export function ProductGallery({
  images,
  productName,
}: {
  images: ApiProductImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const items = images.length
    ? images
    : [
        {
          id: 0,
          url: "/placeholders/product.svg",
          alt_text: productName,
          sort_order: 0,
          is_primary: true,
        },
      ];

  useEffect(() => {
    setActive(0);
  }, [images]);

  function select(index: number) {
    setActive(index);
    const scroller = scrollerRef.current;
    const child = scroller?.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function onScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
    if (index !== active && index >= 0 && index < items.length) {
      setActive(index);
    }
  }

  return (
    <div className="space-y-3">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="img-frame flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-line [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {items.map((image, index) => (
          <figure key={image.id || image.url} className="min-w-full snap-center">
            <ProductImage
              src={image.url}
              alt={image.alt_text || productName}
              priority={index === 0}
              className="aspect-square p-4 sm:p-6"
            />
            <figcaption className="sr-only">
              Image {index + 1} of {items.length}
            </figcaption>
          </figure>
        ))}
      </div>

      {items.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
          {items.map((image, index) => (
            <li key={`thumb-${image.id || image.url}`}>
              <button
                type="button"
                onClick={() => select(index)}
                className={cn(
                  "img-frame size-16 shrink-0 overflow-hidden rounded-xl border",
                  index === active ? "border-sky-600 ring-2 ring-sky-100" : "border-line",
                )}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active}
              >
                <ProductImage src={image.url} alt="" className="p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
