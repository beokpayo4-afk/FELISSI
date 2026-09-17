import { useState } from "react";
import type { ApiOrder } from "@/types/order";

export function UpiPayPanel({ order }: { order: ApiOrder }) {
  const payment = order.payment;
  const [copied, setCopied] = useState(false);

  if (!payment || payment.provider !== "upi" || !payment.intent_url || !payment.upi_vpa) {
    return null;
  }

  const amount = payment.amount ?? order.total;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payment.intent_url)}`;

  async function copyVpa() {
    try {
      await navigator.clipboard.writeText(payment!.upi_vpa!);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
      <p className="text-sm font-semibold text-ink">Pay with UPI</p>
      <p className="mt-1 text-sm text-slate-600">
        Amount <span className="font-semibold text-ink">₹{amount}</span> · UPI ID{" "}
        <span className="font-semibold text-ink">{payment.upi_vpa}</span>
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <img
          src={qrSrc}
          alt={`UPI QR for ${payment.upi_vpa}`}
          width={220}
          height={220}
          className="rounded-xl border border-white bg-white p-2 shadow-sm"
        />
        <div className="flex w-full flex-col gap-2 sm:pt-2">
          <a
            href={payment.intent_url}
            className="inline-flex h-11 items-center justify-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Pay now
          </a>
          <button
            type="button"
            onClick={() => void copyVpa()}
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800"
          >
            {copied ? "UPI ID copied" : "Copy UPI ID"}
          </button>
          <p className="text-xs leading-5 text-slate-500">
            On phone, Pay now opens PhonePe, GPay, or Paytm. On desktop, scan the QR. After you pay,
            we will mark the order paid.
          </p>
        </div>
      </div>
    </div>
  );
}
