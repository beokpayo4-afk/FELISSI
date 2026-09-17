import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage, isNotFoundError } from "@/api/errors";
import { fetchOrder } from "@/api/orders";
import { OrderSummaryCard } from "@/components/account/OrderSummaryCard";
import { UpiPayPanel } from "@/components/checkout/UpiPayPanel";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import type { ApiOrder } from "@/types/order";

export function AccountOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = id ? `Order ${id} · FELISSI` : "Order · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    setError(null);
    setNotFound(false);
    fetchOrder(id)
      .then((result) => {
        if (!cancelled) {
          setOrder(result);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (isNotFoundError(err)) {
          setNotFound(true);
        } else {
          setError(getApiErrorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  if (notFound) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Order not found</h1>
        <p className="mt-2 text-sm text-slate-600">This order is not on your account, or the link is incorrect.</p>
        <Link to="/account/orders" className="mt-4 inline-block text-sm font-medium text-sky-700 hover:text-sky-800">
          Back to orders
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <ShopErrorState
        title="Unable to load this order"
        message={error}
        onRetry={() => {
          setError(null);
          setOrder(null);
          setReloadKey((current) => current + 1);
        }}
      />
    );
  }

  if (!order) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Link to="/account/orders" className="text-sm font-medium text-sky-700 hover:text-sky-800">
        Back to orders
      </Link>
      <div className="mt-4 space-y-5">
        <OrderSummaryCard order={order} />
        {order.payment_method === "online" && order.payment_status === "pending" ? (
          <UpiPayPanel order={order} />
        ) : null}
        <Link
          to={`/account/orders/${order.order_number}/invoice`}
          className="inline-flex h-10 items-center rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Download invoice
        </Link>
      </div>
    </section>
  );
}
