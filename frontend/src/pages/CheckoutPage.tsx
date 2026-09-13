import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createAddress, listAddresses, validateAddressRemote } from "@/api/addresses";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/errors";
import { createOrder, fetchPaymentConfig } from "@/api/orders";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { PaymentSection } from "@/components/checkout/PaymentSection";
import { Container } from "@/components/layout/Container";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import { INDIAN_STATES } from "@/constants/india";
import {
  emptyAddress,
  validateAddress,
  type AddressDraft,
  type AddressFieldErrors,
} from "@/lib/address";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/AuthContext";
import { useCart } from "@/store/CartContext";
import { formatInrMoney } from "@/lib/money";
import type { ApiAddress } from "@/types/auth";
import type { PaymentConfig, PaymentMethod } from "@/types/order";

function newRequestId(): string {
  return crypto.randomUUID();
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { status: authStatus, isAuthenticated, customer, refreshCustomer } = useAuth();
  const cart = useCart();
  const requestId = useRef(newRequestId());
  const submittingRef = useRef(false);

  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [draft, setDraft] = useState<AddressDraft>(() => emptyAddress(customer));
  const [fieldErrors, setFieldErrors] = useState<AddressFieldErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Checkout · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  useEffect(() => {
    if (customer) {
      setDraft((current) => ({
        ...current,
        full_name: current.full_name || customer.full_name,
        phone: current.phone || customer.phone,
      }));
    }
  }, [customer]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    Promise.all([listAddresses(), fetchPaymentConfig()])
      .then(([saved, config]) => {
        if (cancelled) {
          return;
        }
        setAddresses(saved);
        setPaymentConfig(config);
        const preferred = saved.find((item) => item.is_default) ?? saved[0];
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setAddressMode("saved");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFormError(getApiErrorMessage(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  function updateDraft<K extends keyof AddressDraft>(key: K, value: AddressDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handlePlaceOrder(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current || submitting || cart.busy || cart.totals.itemCount === 0) {
      return;
    }

    setFormError(null);
    let addressId = selectedAddressId;

    if (addressMode === "new") {
      const localErrors = validateAddress(draft);
      if (Object.keys(localErrors).length) {
        setFieldErrors(localErrors);
        setFormError("Please correct the highlighted address fields.");
        return;
      }
      submittingRef.current = true;
      setSubmitting(true);
      try {
        await validateAddressRemote(draft);
        const created = await createAddress({
          ...draft,
          is_default: addresses.length === 0,
        });
        addressId = created.id;
        setAddresses((current) => [created, ...current]);
        setSelectedAddressId(created.id);
        await refreshCustomer();
      } catch (error) {
        setFieldErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
    } else if (!addressId) {
      setFormError("Select a shipping address.");
      return;
    } else {
      submittingRef.current = true;
      setSubmitting(true);
    }

    try {
      const order = await createOrder({
        shipping_address_id: addressId,
        payment_method: paymentMethod,
        client_request_id: requestId.current,
      });
      try {
        await cart.reload();
      } catch {
        // The order is already created; confirmation still proceeds.
      }
      navigate(`/order/${order.order_number}`, { replace: true, state: { order } });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (authStatus === "loading" || cart.status === "loading") {
    return (
      <Container className="py-8">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-line" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-96 animate-pulse rounded-2xl bg-line" />
          <div className="h-80 animate-pulse rounded-2xl bg-line" />
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-10">
        <section className="card mx-auto max-w-lg space-y-4 p-6 text-center">
          <h1 className="page-title text-[1.75rem]">Sign in to checkout</h1>
          <p className="text-muted">
            Your guest bag stays on this device. After you sign in, it is copied to your account and
            priced again by the server.
          </p>
          <Link to="/login?next=/checkout" className="btn btn-primary">
            Sign in
          </Link>
        </section>
      </Container>
    );
  }

  if (cart.status === "error") {
    return (
      <Container className="py-10">
        <ShopErrorState
          title="Unable to load checkout"
          message={cart.actionError || "The cart quote could not be calculated."}
          onRetry={() => void cart.reload()}
        />
      </Container>
    );
  }

  if (cart.items.length === 0) {
    return (
      <Container className="py-10">
        <section className="card mx-auto max-w-lg space-y-4 p-6 text-center">
          <h1 className="page-title text-[1.75rem]">Your cart is empty</h1>
          <p className="text-muted">Add products before placing an order.</p>
          <Link to="/shop" className="btn btn-primary">
            Continue shopping
          </Link>
        </section>
      </Container>
    );
  }

  const disabled = submitting || cart.busy;

  return (
    <Container className="py-8 pb-28 lg:pb-8">
      <h1 className="page-title">Checkout</h1>
      <p className="page-lede">
        Review your details. The final payable amount is calculated by the backend when you place
        the order.
      </p>

      <form
        className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
        onSubmit={(event) => void handlePlaceOrder(event)}
        noValidate
      >
        <div className="order-2 space-y-6 lg:order-1">
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-ink">Customer information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id="full_name"
                name="full_name"
                label="Full name"
                value={addressMode === "saved" && selectedAddress ? selectedAddress.full_name : draft.full_name}
                error={fieldErrors.full_name}
                disabled={disabled || addressMode === "saved"}
                autoComplete="name"
                onChange={(value) => updateDraft("full_name", value)}
              />
              <Field
                id="email"
                name="email"
                label="Email"
                type="email"
                value={customer?.email ?? ""}
                autoComplete="email"
                disabled
              />
              <Field
                id="phone"
                name="phone"
                label="Mobile number"
                value={addressMode === "saved" && selectedAddress ? selectedAddress.phone : draft.phone}
                error={fieldErrors.phone}
                disabled={disabled || addressMode === "saved"}
                autoComplete="tel"
                onChange={(value) => updateDraft("phone", value)}
              />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-semibold text-ink">Shipping address</h2>
            {addresses.length ? (
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-cream p-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setAddressMode("saved")}
                  className={cn(
                    "h-9 rounded-full text-sm font-semibold",
                    addressMode === "saved" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600",
                  )}
                >
                  Saved address
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setAddressMode("new")}
                  className={cn(
                    "h-9 rounded-full text-sm font-semibold",
                    addressMode === "new" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600",
                  )}
                >
                  New address
                </button>
              </div>
            ) : null}

            {addressMode === "saved" && addresses.length ? (
              <ul className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <li key={address.id}>
                    <label
                      htmlFor={`saved_address_${address.id}`}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3 has-checked:border-sky-400 has-checked:bg-sky-50"
                    >
                      <input
                        id={`saved_address_${address.id}`}
                        type="radio"
                        name="saved_address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        disabled={disabled}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1"
                      />
                      <span className="text-sm text-muted">
                        <span className="block font-semibold text-ink">{address.full_name}</span>
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        <br />
                        {address.city}, {address.state} {address.pincode}
                        <br />
                        {address.phone}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  id="line1"
                  name="line1"
                  label="Address line 1"
                  value={draft.line1}
                  error={fieldErrors.line1}
                  disabled={disabled}
                  className="sm:col-span-2"
                  autoComplete="address-line1"
                  onChange={(value) => updateDraft("line1", value)}
                />
                <Field
                  id="line2"
                  name="line2"
                  label="Address line 2 (optional)"
                  value={draft.line2}
                  disabled={disabled}
                  className="sm:col-span-2"
                  autoComplete="address-line2"
                  onChange={(value) => updateDraft("line2", value)}
                />
                <Field
                  id="city"
                  name="city"
                  label="City"
                  value={draft.city}
                  error={fieldErrors.city}
                  disabled={disabled}
                  autoComplete="address-level2"
                  onChange={(value) => updateDraft("city", value)}
                />
                <label htmlFor="state" className="field-label">
                  State
                  <select
                    id="state"
                    name="state"
                    value={draft.state}
                    disabled={disabled}
                    autoComplete="address-level1"
                    onChange={(event) => updateDraft("state", event.target.value)}
                    className={cn("field-input", fieldErrors.state && "field-input-error")}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.state ? (
                    <span className="mt-1 block text-sm font-normal text-rose-700">{fieldErrors.state}</span>
                  ) : null}
                </label>
                <Field
                  id="pincode"
                  name="pincode"
                  label="PIN code"
                  inputMode="numeric"
                  value={draft.pincode}
                  error={fieldErrors.pincode}
                  disabled={disabled}
                  autoComplete="postal-code"
                  onChange={(value) => updateDraft("pincode", value.replace(/\D/g, "").slice(0, 6))}
                />
                <Field
                  id="country"
                  name="country"
                  label="Country"
                  value={draft.country}
                  autoComplete="country-name"
                  disabled
                />
              </div>
            )}
          </section>

          <PaymentSection
            method={paymentMethod}
            config={paymentConfig}
            disabled={disabled}
            onChange={setPaymentMethod}
          />

          {formError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="order-1 lg:order-2">
        <CheckoutSummary
          items={cart.items}
          totals={cart.totals}
          disabled={disabled}
          submitting={submitting}
        />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
          <button
            type="submit"
            disabled={disabled || submitting || cart.totals.itemCount === 0}
            className="btn btn-primary h-12 w-full"
          >
            {submitting ? "Placing order…" : `Place order · ${formatInrMoney(cart.totals.total)}`}
          </button>
        </div>
      </form>
    </Container>
  );
}

function Field({
  id,
  name,
  label,
  value,
  error,
  disabled,
  className,
  type = "text",
  inputMode,
  autoComplete,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  type?: string;
  inputMode?: "numeric";
  autoComplete?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className={cn("field-label", className)}>
      {label}
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        disabled={disabled || !onChange}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn("field-input", error && "field-input-error")}
      />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
