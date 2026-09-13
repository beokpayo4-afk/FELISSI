import { resolveMediaUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const resolved = resolveMediaUrl(src) || "/placeholders/product.svg";
  return (
    <img
      src={resolved}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("size-full object-contain p-3", className)}
      onError={(event) => {
        event.currentTarget.src = "/placeholders/product.svg";
      }}
    />
  );
}
