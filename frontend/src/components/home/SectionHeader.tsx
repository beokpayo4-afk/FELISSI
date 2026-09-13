import { Link } from "react-router-dom";

export function SectionHeader({
  eyebrow,
  title,
  actionTo,
  actionLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  actionTo?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="page-kicker">{eyebrow}</p> : null}
        <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
      </div>
      {actionTo ? (
        <Link to={actionTo} className="link-brand text-sm">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
