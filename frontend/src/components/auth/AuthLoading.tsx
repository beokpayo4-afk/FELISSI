import { Container } from "@/components/layout/Container";

export function AuthLoading() {
  return (
    <Container className="py-10">
      <div className="mx-auto h-64 max-w-lg animate-pulse rounded-2xl bg-slate-200" />
    </Container>
  );
}
