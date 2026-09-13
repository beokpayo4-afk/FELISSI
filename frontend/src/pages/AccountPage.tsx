import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { listOrders } from "@/api/orders";
import { formatInrMoney } from "@/lib/money";
import { toNumber } from "@/lib/catalog";
import { formatOrderDate, formatOrderStatus } from "@/lib/orders";
import { useAuth } from "@/store/AuthContext";
import type { ApiOrder } from "@/types/order";

export function AccountPage() {
  const { customer, logout } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Account · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listOrders(1)
      .then((page) => {
        if (!cancelled) {
          setOrders(page.results.slice(0, 3));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setOrdersError(getApiErrorMessage(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (customer?.is_staff) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Your account</h1>
        <p className="mt-2 text-slate-600">{customer?.full_name}</p>
        <p className="text-sm text-slate-600">{customer?.email}</p>
        <p className="text-sm text-slate-600">{customer?.phone}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/account/orders"
            className="inline-flex h-11 items-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            View orders
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-800"
          >
            Sign out
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <AccountLink title="Profile" to="/account/profile" body="Update your name and mobile number." />
        <AccountLink title="Addresses" to="/account/addresses" body="Manage delivery addresses." />
        <AccountLink title="Wishlist" to="/account/wishlist" body="Electronics you saved for later." />
        <AccountLink title="Cart" to="/cart" body="Review items ready for checkout." />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Recent orders</h2>
          <Link to="/account/orders" className="text-sm font-medium text-sky-700 hover:text-sky-800">
            See all
          </Link>
        </div>
        {ordersError ? <p className="mt-3 text-sm text-rose-700">{ordersError}</p> : null}
        {!ordersError && orders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">You have not placed an order yet.</p>
        ) : null}
        {orders.length ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link
                    to={`/account/orders/${order.order_number}`}
                    className="font-semibold text-slate-950 hover:text-sky-700"
                  >
                    {order.order_number}
                  </Link>
                  <p className="text-sm text-slate-600">
                    {formatOrderDate(order.created_at)} · {formatOrderStatus(order.order_status)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatInrMoney(toNumber(order.total))}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function AccountLink({ title, to, body }: { title: string; to: string; body: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-sky-300">
      <h2 className="font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </Link>
  );
}
