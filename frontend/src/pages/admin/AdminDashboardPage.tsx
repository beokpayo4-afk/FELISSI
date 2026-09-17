import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, Clock3, IndianRupee, Package, RefreshCw, Star, Truck, Users, Warehouse } from "lucide-react";
import { getApiErrorMessage } from "@/api/errors";
import { fetchStaffDashboard } from "@/api/staff";
import { StatCard } from "@/components/admin/StatCard";
import { formatInr, formatInrMoney } from "@/lib/money";
import { toNumber } from "@/lib/catalog";
import type { StaffDashboard } from "@/types/staff";

function formatWorkspaceTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export function AdminDashboardPage() {
  const [data, setData] = useState<StaffDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  const load = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      setData(await fetchStaffDashboard());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard · FELISSI admin";
    void load();
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [load]);

  const maxSale = useMemo(() => {
    if (!data) {
      return 1;
    }
    return Math.max(...data.sales.map((row) => toNumber(row.total)), 1);
  }, [data]);

  const mixMax = useMemo(() => {
    if (!data) {
      return 1;
    }
    return Math.max(data.order_mix.pending, data.order_mix.paid, data.order_mix.delivered, data.order_mix.cancelled, 1);
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data
              ? `${formatWorkspaceTime(data.generated_at)} · ${data.timezone}`
              : pending
                ? "Loading workspace…"
                : "Asia/Kolkata"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/products/new"
            className="inline-flex h-10 items-center rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
          >
            + Add product
          </Link>
          <Link
            to="/admin/products"
            className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
          >
            View products
          </Link>
          <Link
            to="/admin/orders"
            className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
          >
            View orders
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 disabled:opacity-50"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total products"
          value={String(data?.totals.products ?? "—")}
          hint="Published catalogue items"
          icon={Package}
        />
        <StatCard
          label="Orders"
          value={String(data?.totals.orders ?? "—")}
          hint={`${data?.totals.orders_pending ?? 0} pending`}
          icon={Clock3}
        />
        <StatCard
          label="Customers"
          value={String(data?.totals.customers ?? "—")}
          hint="Registered shoppers"
          icon={Users}
        />
        <StatCard
          label="Revenue"
          value={data ? formatInr(toNumber(data.totals.revenue)) : "—"}
          hint={data ? `Today ${formatInrMoney(toNumber(data.totals.revenue_today))}` : "Paid orders"}
          icon={IndianRupee}
        />
        <StatCard
          label="Paid orders"
          value={String(data?.paid_orders ?? "—")}
          hint="Payment confirmed"
          icon={CircleCheck}
          tone="emerald"
        />
        <StatCard
          label="Delivered"
          value={String(data?.delivered ?? "—")}
          hint="Fulfilled orders"
          icon={Truck}
        />
        <StatCard
          label="Low stock"
          value={String(data?.low_stock ?? "—")}
          hint="At or below 5 units"
          icon={Warehouse}
          tone="amber"
        />
        <StatCard
          label="Pending reviews"
          value={String(data?.pending_reviews ?? "—")}
          hint="Awaiting moderation"
          icon={Star}
          tone="rose"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Sales overview</h2>
          <p className="mt-1 text-sm text-slate-500">Orders across the last 14 days</p>
          <div className="mt-8 flex h-56 items-end gap-1.5">
            {(data?.sales ?? Array.from({ length: 14 }, (_, index) => ({ date: String(index), total: "0" }))).map(
              (row) => {
                const amount = toNumber(row.total);
                const height = Math.max(4, Math.round((amount / maxSale) * 100));
                return (
                  <div key={row.date} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-48 w-full items-end rounded-t-md bg-[#f3eee6]">
                      <div
                        className="w-full rounded-t-md bg-[#2f6f4e]"
                        style={{ height: `${height}%` }}
                        title={`${row.date}: ${formatInrMoney(amount)}`}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Order mix</h2>
          <p className="mt-1 text-sm text-slate-500">Current fulfilment snapshot</p>
          <ul className="mt-6 space-y-5">
            {(
              [
                ["Pending", data?.order_mix.pending ?? 0],
                ["Paid", data?.order_mix.paid ?? 0],
                ["Delivered", data?.order_mix.delivered ?? 0],
                ["Cancelled", data?.order_mix.cancelled ?? 0],
              ] as const
            ).map(([label, count]) => (
              <li key={label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-950">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#f3eee6]">
                  <div
                    className="h-2 rounded-full bg-forest"
                    style={{ width: `${Math.round((count / mixMax) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
