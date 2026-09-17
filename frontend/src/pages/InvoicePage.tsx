import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { fetchOrder } from "@/api/orders";
import { fetchStaffOrder } from "@/api/staff";
import { InvoiceDocument } from "@/components/account/InvoiceDocument";
import type { ApiOrder } from "@/types/order";

export function InvoicePage({ mode = "customer" }: { mode?: "customer" | "staff" }) {
  const { id, orderNumber } = useParams();
  const number = orderNumber || id;
  const backTo = mode === "staff" ? `/admin/orders/${number ?? ""}` : "/account/orders";
  const backLabel = mode === "staff" ? "Back to order" : "Back to orders";
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = number ? `Invoice ${number} · FELISSI` : "Invoice · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [number]);

  useEffect(() => {
    if (!number) {
      return;
    }
    let cancelled = false;
    const load = mode === "staff" ? fetchStaffOrder(number) : fetchOrder(number);
    load
      .then((result) => {
        if (!cancelled) {
          setOrder(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, number]);

  if (error || !order) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Invoice unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">{error || "This invoice could not be loaded."}</p>
        <Link to={backTo} className="mt-4 inline-block text-sm font-medium text-sky-700">
          {backLabel}
        </Link>
      </section>
    );
  }

  return (
    <div>
      <Link to={backTo} className="mb-4 inline-block text-sm font-medium text-sky-700 print:hidden">
        {backLabel}
      </Link>
      <InvoiceDocument order={order} onDownload={() => window.print()} />
    </div>
  );
}
