import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function AuthField({
  id,
  name,
  label,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label htmlFor={id} className="field-label">
      {label}
      <input
        id={id}
        name={name ?? id}
        aria-invalid={Boolean(error)}
        {...props}
        className={cn("field-input", error && "field-input-error", className)}
      />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
