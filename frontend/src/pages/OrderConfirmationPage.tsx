import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { fetchOrder } from "@/api/orders";
import { UpiPayPanel } from "@/components/checkout/UpiPayPanel";
import { Container } from "@/components/layout/Container";
import { MoneyBreakdown } from "@/components/shop/MoneyBreakdown";
import { formatInrMoney } from "@/lib/money";
import { toNumber } from "@/lib/catalog";
import { useAuth } from "@/store/AuthContext";
import type { ApiOrder } from "@/types/order";

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const { isAuthenticated, status: authStatus } = useAuth();
  const seeded = (location.state as { order?: ApiOrder } | null)?.order;
  const [order, setOrder] = useState<ApiOrder | null>(
    seeded && seeded.order_number === orderNumber ? seeded : null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = orderNumber ? `Order ${orderNumber} · FELISSI` : "Order · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [orderNumber]);

  useEffect(() => {
    if (!orderNumber || !isAuthenticated) {
      return;
    }
    if (order?.order_number === orderNumber && order.items) {
      return;
    }
    let cancelled = false;
    fetchOrder(orderNumber)
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
  }, [isAuthenticated, order?.items, order?.order_number, orderNumber]);

  if (authStatus === "loading") {
    return (
      <Container className="py-10">
        <div className="mx-auto h-64 max-w-lg animate-pulse rounded-2xl bg-slate-200" />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-10">
        <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Sign in to view this order</h1>
          <Link
            to={`/login?next=/order/${orderNumber ?? ""}`}
            className="inline-flex h-11 items-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Sign in
          </Link>
        </section>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-10">
        <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Order not found</h1>
          <p className="text-slate-600">{error || "This order is not available."}</p>
          <Link to="/shop" className="text-sm font-medium text-sky-700 hover:text-sky-800">
            Back to shop
          </Link>
        </section>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <section className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">Order placed</p>
        <h1 className="text-3xl font-semibold tracking-tight">{order.order_number}</h1>
        <p className="text-slate-600">
          Amounts below are the backend-calculated totals stored on the order. Payment method:{" "}
          {order.payment_method === "cod" ? "Cash on delivery" : "UPI / Online"}.
        </p>
        {order.payment_method === "online" ? <UpiPayPanel order={order} /> : null}
        {order.payment?.message && order.payment.provider !== "upi" ? (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{order.payment.message}</p>
        ) : null}
        <MoneyBreakdown
          totals={{
            subtotal: toNumber(order.subtotal),
            discount: toNumber(order.discount),
            gst: toNumber(order.gst),
            shipping: toNumber(order.shipping_charge),
            total: toNumber(order.total),
            gstInclusive: Boolean(order.gst_inclusive),
          }}
          finalLabel="Final total"
        />
        {order.items?.length ? (
          <ul className="space-y-2 border-t border-slate-100 pt-4 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span>{formatInrMoney(toNumber(item.unit_price) * item.quantity)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="inline-flex h-11 items-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Continue shopping
          </Link>
          <Link
            to={order ? `/account/orders/${order.order_number}` : "/account/orders"}
            className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-800"
          >
            Account
          </Link>
          <Link
            to={`/account/orders/${order.order_number}/invoice`}
            className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-800"
          >
            Invoice
          </Link>
        </div>
      </section>
    </Container>
  );
}
