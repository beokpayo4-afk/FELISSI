export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-11 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="flex gap-3">
          <div className="h-11 flex-1 animate-pulse rounded-full bg-slate-200" />
          <div className="h-11 flex-1 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
