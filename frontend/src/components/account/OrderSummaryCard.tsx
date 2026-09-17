import { MoneyBreakdown } from "@/components/shop/MoneyBreakdown";
import { formatInrMoney } from "@/lib/money";
import { toNumber } from "@/lib/catalog";
import {
  formatOrderDate,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/lib/orders";
import type { ApiOrder } from "@/types/order";

export function OrderSummaryCard({ order }: { order: ApiOrder }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-slate-500">{formatOrderDate(order.created_at)}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{order.order_number}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {formatOrderStatus(order.order_status)} · {formatPaymentMethod(order.payment_method)} ·{" "}
          {formatPaymentStatus(order.payment_status)}
        </p>
      </div>

      {order.items?.length ? (
        <ul className="space-y-2 border-t border-slate-100 pt-4 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.product_name}
                <span className="block text-xs text-slate-500">
                  {item.sku ? `${item.sku} · ` : ""}Qty {item.quantity}
                </span>
              </span>
              <span className="text-right">
                {formatInrMoney(toNumber(item.unit_price) * item.quantity)}
                {item.gst_percentage ? (
                  <span className="block text-xs text-slate-500">
                    GST {toNumber(item.gst_percentage)}%
                    {item.gst_amount ? ` · ${formatInrMoney(toNumber(item.gst_amount))}` : ""}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="border-t border-slate-100 pt-4">
        <MoneyBreakdown
          totals={{
            subtotal: toNumber(order.subtotal),
            discount: toNumber(order.discount),
            gst: toNumber(order.gst),
            shipping: toNumber(order.shipping_charge),
            total: toNumber(order.total),
            gstInclusive: Boolean(order.gst_inclusive),
          }}
          finalLabel="Total"
        />
      </div>

      {order.shipping_address ? (
        <div className="border-t border-slate-100 pt-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-950">Shipping address</p>
          <p className="mt-1">{order.shipping_address.full_name}</p>
          <p>
            {order.shipping_address.line1}
            {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}
          </p>
          <p>
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
          </p>
          <p>{order.shipping_address.phone}</p>
        </div>
      ) : null}
    </div>
  );
}
