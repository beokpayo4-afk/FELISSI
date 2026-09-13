import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Container>
      <section className="mx-auto max-w-xl space-y-4 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="text-slate-600">{description}</p>
        <Link
          to="/shop"
          className="inline-flex h-10 items-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Browse the shop
        </Link>
      </section>
    </Container>
  );
}
