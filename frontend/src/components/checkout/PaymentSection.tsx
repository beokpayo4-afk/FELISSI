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
  const onlineReady = config?.methods.find((item) => item.id === "online")?.ready ?? false;

  return (
    <section className="card p-5">
      <h2 className="text-lg font-semibold text-ink">Payment</h2>
      <p className="mt-1 text-sm text-muted">
        Card and UPI details are never collected on this site. Online checkout is a reserved
        connection only.
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
            <span className="block text-sm font-semibold text-ink">Online payment</span>
            <span className="mt-0.5 block text-sm text-muted">
              {onlineReady
                ? `${config?.provider ?? "Gateway"} session will start after you place the order.`
                : "Gateway keys are not loaded. The order can still be placed as pending, with no charge."}
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
