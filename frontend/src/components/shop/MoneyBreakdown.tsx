import { formatInrMoney } from "@/lib/money";

export type MoneyBreakdownTotals = {
  subtotal: number;
  discount: number;
  gst: number;
  shipping: number;
  total: number;
  itemCount?: number;
  gstInclusive?: boolean;
};

export function MoneyBreakdown({
  totals,
  finalLabel = "Grand total",
}: {
  totals: MoneyBreakdownTotals;
  finalLabel?: string;
}) {
  const inclusive = Boolean(totals.gstInclusive);
  return (
    <dl className="space-y-2 text-sm">
      <Row
        label={inclusive ? "Subtotal (incl. GST)" : "Product price (ex-GST)"}
        value={formatInrMoney(totals.subtotal)}
      />
      {totals.discount > 0 ? (
        <Row
          label="Discount"
          value={`−${formatInrMoney(totals.discount)}`}
          emphasis
        />
      ) : null}
      <Row
        label={inclusive ? `GST (included)` : "GST"}
        value={formatInrMoney(totals.gst)}
      />
      <Row label={finalLabel} value={formatInrMoney(totals.total)} strong />
    </dl>
  );
}

function Row({
  label,
  value,
  strong,
  emphasis,
}: {
  label: string;
  value: string;
  strong?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-slate-200 pt-3 text-base" : ""}`}>
      <dt className={strong ? "font-semibold text-slate-950" : "text-slate-600"}>{label}</dt>
      <dd
        className={
          strong
            ? "font-semibold text-slate-950"
            : emphasis
              ? "font-medium text-emerald-700"
              : "font-medium text-slate-950"
        }
      >
        {value}
      </dd>
    </div>
  );
}
