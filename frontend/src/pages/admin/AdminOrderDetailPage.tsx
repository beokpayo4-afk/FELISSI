import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage, isNotFoundError } from "@/api/errors";
import { fetchStaffOrder, patchStaffOrder } from "@/api/staff";
import { OrderSummaryCard } from "@/components/account/OrderSummaryCard";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import { formatOrderStatus } from "@/lib/orders";
import type { StaffOrderDetail } from "@/types/staff";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export function AdminOrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<StaffOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = orderNumber ? `Order ${orderNumber} · FELISSI admin` : "Order · FELISSI admin";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [orderNumber]);

  useEffect(() => {
    if (!orderNumber) {
      return;
    }
    let cancelled = false;
    setError(null);
    setNotFound(false);
    fetchStaffOrder(orderNumber)
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
  }, [orderNumber, reloadKey]);

  async function updateStatus(order_status: string) {
    if (!order) {
      return;
    }
    try {
      const updated = await patchStaffOrder(order.order_number, { order_status });
      setOrder(updated);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  if (notFound) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Order not found</h1>
        <p className="mt-2 text-sm text-slate-600">This order number is not in the store, or the link is incorrect.</p>
        <Link to="/admin/orders" className="mt-4 inline-block text-sm font-medium text-sky-700 hover:text-sky-800">
          Back to orders
        </Link>
      </section>
    );
  }

  if (error && !order) {
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
    return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  }

  return (
    <div className="space-y-5">
      <Link to="/admin/orders" className="text-sm font-medium text-sky-700 hover:text-sky-800">
        Back to orders
      </Link>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Customer</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{order.customer_name}</p>
            <p className="text-sm text-slate-600">{order.customer_email}</p>
            {order.customer_phone ? <p className="text-sm text-slate-600">{order.customer_phone}</p> : null}
          </div>
          <label className="text-sm text-slate-600">
            Fulfillment
            <select
              id="admin-order-status"
              name="order_status"
              value={order.order_status}
              onChange={(event) => void updateStatus(event.target.value)}
              autoComplete="off"
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatOrderStatus(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <OrderSummaryCard order={order} />
        </div>

        <Link
          to={`/admin/orders/${order.order_number}/invoice`}
          className="mt-6 inline-flex h-10 items-center rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Download invoice
        </Link>
      </div>
    </div>
  );
}
