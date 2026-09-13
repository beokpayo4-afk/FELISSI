import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Container className="py-10 sm:py-14">
      <section className="card mx-auto max-w-lg p-6 sm:p-8">
        <h1 className="page-title text-[1.75rem] sm:text-3xl">{title}</h1>
        {description ? <p className="page-lede">{description}</p> : null}
        {children}
      </section>
    </Container>
  );
}
