import { Link } from "react-router-dom";

export function PromoBanner({
  title,
  copy,
  to,
  actionLabel,
}: {
  title: string;
  copy: string;
  to: string;
  actionLabel: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/90 to-sky-950" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/75 sm:text-base">{copy}</p>
        </div>
        <Link
          to={to}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
