import { useId } from "react";
import { DEFAULT_ORDERING, SORT_OPTIONS } from "@/lib/shopQuery";

export function ProductSortSelect({
  value,
  onChange,
  options = SORT_OPTIONS,
}: {
  value?: string;
  onChange: (ordering: string) => void;
  options?: ReadonlyArray<{ value: string; label: string }>;
}) {
  const fieldId = useId();
  const known = options.some((option) => option.value === value);
  const selected = known ? value : options[0]?.value ?? DEFAULT_ORDERING;

  return (
    <label htmlFor={fieldId} className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">Sort</span>
      <select
        id={fieldId}
        name="ordering"
        value={selected}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
