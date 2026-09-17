import type { PaymentConfig, PaymentMethod } from "@/types/order";

export function PaymentSection({
  method,
  config,
  disabled,
  onChange,
}: {
  method: PaymentMethod;
  config: PaymentConfig | null;
  disabled?: boolean;
  onChange: (method: PaymentMethod) => void;
}) {
  const online = config?.methods.find((item) => item.id === "online");
  const onlineReady = online?.ready ?? false;
  const isUpi = config?.provider === "upi" && Boolean(config.upi_vpa);

  return (
    <section className="card p-5">
      <h2 className="text-lg font-semibold text-ink">Payment</h2>
      <p className="mt-1 text-sm text-muted">
        {isUpi
          ? "Choose UPI to pay directly after placing the order. We never ask for your UPI PIN on this site."
          : "Card and UPI PINs are never collected on this site."}
      </p>

      <div className="mt-4 grid gap-3">
        <label
          htmlFor="payment_cod"
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3 has-checked:border-sky-400 has-checked:bg-sky-50"
        >
          <input
            id="payment_cod"
            type="radio"
            name="payment_method"
            value="cod"
            checked={method === "cod"}
            disabled={disabled}
            onChange={() => onChange("cod")}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">Cash on delivery</span>
            <span className="mt-0.5 block text-sm text-muted">
              Pay when the order arrives. The payable amount is confirmed by the server.
            </span>
          </span>
        </label>

        <label
          htmlFor="payment_online"
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3 has-checked:border-sky-400 has-checked:bg-sky-50"
        >
          <input
            id="payment_online"
            type="radio"
            name="payment_method"
            value="online"
            checked={method === "online"}
            disabled={disabled}
            onChange={() => onChange("online")}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">
              {isUpi ? "Pay with UPI" : "Online payment"}
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              {isUpi && onlineReady
                ? `After you place the order, open any UPI app and pay ${config?.upi_vpa}.`
                : onlineReady
                  ? `${config?.provider ?? "Gateway"} session will start after you place the order.`
                  : "Online pay is not connected yet. The order can still be placed as pending."}
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
