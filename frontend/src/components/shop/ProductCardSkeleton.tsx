export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square animate-pulse bg-cream" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-line" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-cream" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-line" />
        <div className="h-10 animate-pulse rounded-full bg-cream" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
