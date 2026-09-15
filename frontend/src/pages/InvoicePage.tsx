import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { fetchOrder } from "@/api/orders";
import { MoneyBreakdown } from "@/components/shop/MoneyBreakdown";
import { company } from "@/constants/company";
import { toNumber } from "@/lib/catalog";
import { formatInrMoney } from "@/lib/money";
import { formatOrderDate } from "@/lib/orders";
import type { ApiOrder } from "@/types/order";

export function InvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = id ? `Invoice ${id} · FELISSI` : "Invoice · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    fetchOrder(id)
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
  }, [id]);

  if (error || !order) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Invoice unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">{error || "This invoice could not be loaded."}</p>
        <Link to="/account/orders" className="mt-4 inline-block text-sm font-medium text-sky-700">
          Back to orders
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax invoice</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{order.order_number}</h1>
          <p className="mt-1 text-sm text-slate-600">{formatOrderDate(order.created_at)}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 print:hidden"
        >
          Print
        </button>
      </div>

      <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold text-slate-950">Sold by</p>
          <p className="mt-1">{company.legalName}</p>
          <p>{company.address}</p>
          <p>{company.gstinLabel}</p>
        </div>
        {order.shipping_address ? (
          <div>
            <p className="font-semibold text-slate-950">Bill / ship to</p>
            <p className="mt-1">{order.shipping_address.full_name}</p>
            <p>
              {order.shipping_address.line1}
              {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}
            </p>
            <p>
              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
            </p>
          </div>
        ) : null}
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 font-medium">GST %</th>
            <th className="py-2 font-medium">Taxable</th>
            <th className="py-2 font-medium">GST</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-2">
                {item.product_name} × {item.quantity}
                <span className="block text-xs text-slate-500">{item.sku}</span>
              </td>
              <td className="py-2">{toNumber(item.gst_percentage)}%</td>
              <td className="py-2">{formatInrMoney(toNumber(item.taxable_amount))}</td>
              <td className="py-2">{formatInrMoney(toNumber(item.gst_amount))}</td>
              <td className="py-2 text-right">{formatInrMoney(toNumber(item.unit_price) * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 max-w-sm ml-auto">
        <MoneyBreakdown
          totals={{
            subtotal: toNumber(order.subtotal),
            discount: toNumber(order.discount),
            gst: toNumber(order.gst),
            shipping: toNumber(order.shipping_charge),
            total: toNumber(order.total),
            gstInclusive: Boolean(order.gst_inclusive),
          }}
          finalLabel="Amount payable"
        />
        <p className="mt-3 text-xs text-slate-500">
          {order.gst_inclusive
            ? "Catalog prices on this invoice include GST. GST is shown for disclosure and is not added again."
            : "Catalog prices on this invoice exclude GST. GST is added after discount."}
        </p>
      </div>
    </section>
  );
}
