import { formatInrMoney } from "@/lib/money";
import type { ApiProductDetail } from "@/types/catalog";

export function ProductSpecs({ product }: { product: ApiProductDetail }) {
  const rows: Array<[string, string]> = [
    ["Brand", product.brand.name],
    ["Category", product.category.name],
    ["Subcategory", product.subcategory?.name ?? "—"],
    ["SKU", product.sku],
    [
      "GST",
      `${Number(product.gst_percentage)}% · ${product.gst_inclusive ? "included in price" : "added at checkout"}`,
    ],
    ["Taxable price", formatInrMoney(Number(product.taxable_price))],
    ["GST amount", formatInrMoney(Number(product.gst_amount))],
    ["Stock", String(product.stock_quantity)],
  ];

  for (const variant of product.variants) {
    rows.push([`Variant · ${variant.name}`, `${variant.sku} · ${variant.stock_quantity} in stock`]);
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Specifications</h2>
      <dl className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="font-medium text-slate-500">{label}</dt>
            <dd className="text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
