import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";

export function NotFoundPage() {
  return (
    <Container className="py-16">
      <section className="card mx-auto max-w-lg px-6 py-12 text-center">
        <p className="page-kicker">404</p>
        <h1 className="page-title mt-3">Page not found</h1>
        <p className="page-lede">This route is not part of the current storefront.</p>
        <Link to="/" className="btn btn-primary mt-6">
          Back to home
        </Link>
      </section>
    </Container>
  );
}
