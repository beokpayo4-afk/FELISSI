import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { listOrders } from "@/api/orders";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import { toNumber } from "@/lib/catalog";
import { formatInrMoney } from "@/lib/money";
import { formatOrderDate, formatOrderStatus, formatPaymentMethod } from "@/lib/orders";
import type { ApiOrder } from "@/types/order";

export function AccountOrdersPage() {
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Orders · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    listOrders(page)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setOrders(result.results);
        setHasNext(Boolean(result.next));
        setHasPrevious(Boolean(result.previous));
        setStatus("ready");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Orders</h1>
      <p className="mt-2 text-sm text-slate-600">Totals shown here are the amounts stored by the server.</p>

      {status === "loading" ? <div className="mt-6 h-48 animate-pulse rounded-2xl bg-slate-200" /> : null}

      {status === "error" ? (
        <div className="mt-6">
          <ShopErrorState title="Unable to load orders" message={error ?? ""} onRetry={() => setPage(page)} />
        </div>
      ) : null}

      {status === "ready" && orders.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          No orders yet.{" "}
          <Link to="/shop" className="font-medium text-sky-700 hover:text-sky-800">
            Browse electronics
          </Link>
        </p>
      ) : null}

      {status === "ready" && orders.length ? (
        <ul className="mt-6 divide-y divide-slate-100">
          {orders.map((order) => (
            <li key={order.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/account/orders/${order.order_number}`}
                    className="font-semibold text-slate-950 hover:text-sky-700"
                  >
                    {order.order_number}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatOrderDate(order.created_at)} · {formatOrderStatus(order.order_status)} ·{" "}
                    {formatPaymentMethod(order.payment_method)}
                  </p>
                </div>
                <p className="font-semibold">{formatInrMoney(toNumber(order.total))}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {status === "ready" && (hasNext || hasPrevious) ? (
        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            disabled={!hasPrevious}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-slate-600">Page {page}</span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
