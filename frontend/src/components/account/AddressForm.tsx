import { INDIAN_STATES } from "@/constants/india";
import { cn } from "@/lib/utils";
import type { AddressDraft, AddressFieldErrors } from "@/lib/address";

const FIELD_AUTOCOMPLETE: Partial<Record<keyof AddressDraft, string>> = {
  full_name: "name",
  phone: "tel",
  line1: "address-line1",
  line2: "address-line2",
  city: "address-level2",
  state: "address-level1",
  pincode: "postal-code",
  country: "country-name",
};

export function AddressForm({
  draft,
  errors,
  disabled,
  showDefault,
  isDefault,
  onChange,
  onDefaultChange,
}: {
  draft: AddressDraft;
  errors: AddressFieldErrors;
  disabled?: boolean;
  showDefault?: boolean;
  isDefault?: boolean;
  onChange: (field: keyof AddressDraft, value: string) => void;
  onDefaultChange?: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        id="addr_full_name"
        name="full_name"
        label="Full name"
        value={draft.full_name}
        error={errors.full_name}
        disabled={disabled}
        autoComplete={FIELD_AUTOCOMPLETE.full_name}
        onChange={(value) => onChange("full_name", value)}
      />
      <Field
        id="addr_phone"
        name="phone"
        label="Mobile number"
        value={draft.phone}
        error={errors.phone}
        disabled={disabled}
        inputMode="numeric"
        autoComplete={FIELD_AUTOCOMPLETE.phone}
        onChange={(value) => onChange("phone", value)}
      />
      <Field
        id="addr_line1"
        name="line1"
        label="Address line 1"
        value={draft.line1}
        error={errors.line1}
        disabled={disabled}
        className="sm:col-span-2"
        autoComplete={FIELD_AUTOCOMPLETE.line1}
        onChange={(value) => onChange("line1", value)}
      />
      <Field
        id="addr_line2"
        name="line2"
        label="Address line 2 (optional)"
        value={draft.line2}
        disabled={disabled}
        className="sm:col-span-2"
        autoComplete={FIELD_AUTOCOMPLETE.line2}
        onChange={(value) => onChange("line2", value)}
      />
      <Field
        id="addr_city"
        name="city"
        label="City"
        value={draft.city}
        error={errors.city}
        disabled={disabled}
        autoComplete={FIELD_AUTOCOMPLETE.city}
        onChange={(value) => onChange("city", value)}
      />
      <label htmlFor="addr_state" className="block text-sm font-medium text-slate-800">
        State
        <select
          id="addr_state"
          name="state"
          value={draft.state}
          disabled={disabled}
          autoComplete="address-level1"
          onChange={(event) => onChange("state", event.target.value)}
          className={cn(
            "mt-1 h-11 w-full rounded-full border bg-white px-4 text-sm outline-none focus:border-sky-400",
            errors.state ? "border-rose-400" : "border-slate-200",
          )}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors.state ? (
          <span className="mt-1 block text-sm font-normal text-rose-700">{errors.state}</span>
        ) : null}
      </label>
      <Field
        id="addr_pincode"
        name="pincode"
        label="PIN code"
        value={draft.pincode}
        error={errors.pincode}
        disabled={disabled}
        inputMode="numeric"
        autoComplete={FIELD_AUTOCOMPLETE.pincode}
        onChange={(value) => onChange("pincode", value.replace(/\D/g, "").slice(0, 6))}
      />
      <Field
        id="addr_country"
        name="country"
        label="Country"
        value={draft.country}
        disabled
        autoComplete={FIELD_AUTOCOMPLETE.country}
      />
      {showDefault ? (
        <label
          htmlFor="addr_is_default"
          className="flex items-center gap-2 text-sm font-medium text-slate-800 sm:col-span-2"
        >
          <input
            id="addr_is_default"
            name="is_default"
            type="checkbox"
            checked={Boolean(isDefault)}
            disabled={disabled}
            onChange={(event) => onDefaultChange?.(event.target.checked)}
          />
          Set as default address
        </label>
      ) : null}
    </div>
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
  inputMode?: "numeric";
  autoComplete?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className={cn("block text-sm font-medium text-slate-800", className)}>
      {label}
      <input
        id={id}
        name={name}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled || !onChange}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(
          "mt-1 h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50",
          error ? "border-rose-400" : "border-slate-200",
        )}
      />
      {error ? <span className="mt-1 block text-sm font-normal text-rose-700">{error}</span> : null}
    </label>
  );
}
