import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { listStaffOrders, patchStaffOrder } from "@/api/staff";
import { toNumber } from "@/lib/catalog";
import { formatInrMoney } from "@/lib/money";
import { formatOrderDate, formatOrderStatus, formatPaymentStatus } from "@/lib/orders";
import type { StaffOrder } from "@/types/staff";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export function AdminOrdersPage() {
  const [items, setItems] = useState<StaffOrder[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    document.title = "Orders · FELISSI admin";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPending(true);
    listStaffOrders(page, query)
      .then((result) => {
        if (!cancelled) {
          setItems(result.results);
          setCount(result.count);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPending(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, query]);

  async function updateStatus(order: StaffOrder, order_status: string) {
    try {
      const updated = await patchStaffOrder(order.order_number, { order_status });
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          {count} store orders · Open an order for the shipping address, items, quantities, and invoice
        </p>
      </div>

      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
        className="flex gap-2"
      >
        <label htmlFor="admin-order-search" className="sr-only">
          Search orders
        </label>
        <input
          id="admin-order-search"
          name="order_search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order number or customer"
          autoComplete="off"
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm"
        />
        <button type="submit" className="h-11 rounded-xl bg-forest px-4 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {pending ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Loading orders…
                </td>
              </tr>
            ) : null}
            {!pending && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No orders yet.
                </td>
              </tr>
            ) : null}
            {items.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link to={`/admin/orders/${order.order_number}`} className="font-medium text-sky-700 hover:text-sky-800">
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-slate-500">{formatOrderDate(order.created_at)}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{order.customer_name}</p>
                  <p className="text-xs text-slate-500">{order.customer_email}</p>
                </td>
                <td className="px-4 py-3">{order.item_count}</td>
                <td className="px-4 py-3">{formatInrMoney(toNumber(order.total))}</td>
                <td className="px-4 py-3">{formatPaymentStatus(order.payment_status)}</td>
                <td className="px-4 py-3">
                  <select
                    id={`order-status-${order.id}`}
                    name={`order_status_${order.id}`}
                    value={order.order_status}
                    onChange={(event) => void updateStatus(order, event.target.value)}
                    autoComplete="off"
                    aria-label={`Status for order ${order.order_number}`}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatOrderStatus(status)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
