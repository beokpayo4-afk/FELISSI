import { useId } from "react";

export function QuantitySelector({
  value,
  max,
  onChange,
  disabled,
  id,
  name = "quantity",
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const limit = Math.max(1, max);

  function set(next: number) {
    onChange(Math.min(limit, Math.max(1, next)));
  }

  return (
    <div className="inline-flex h-11 items-center rounded-full border border-line bg-white">
      <button
        type="button"
        className="h-11 w-11 text-lg text-ink disabled:opacity-40"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        id={fieldId}
        name={name}
        type="number"
        min={1}
        max={limit}
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => set(Number(event.target.value) || 1)}
        className="h-11 w-12 border-x border-line bg-transparent text-center text-sm font-semibold outline-none disabled:opacity-40"
        aria-label="Quantity"
      />
      <button
        type="button"
        className="h-11 w-11 text-lg text-ink disabled:opacity-40"
        onClick={() => set(value + 1)}
        disabled={disabled || value >= limit}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
