import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

export function ContentPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Container className="py-10">
      <article className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <div className="space-y-4 text-sm leading-7 text-slate-600 sm:text-base">{children}</div>
      </article>
    </Container>
  );
}
