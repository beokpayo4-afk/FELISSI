import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  forest: "btn btn-forest",
  ghost: "btn btn-ghost",
  danger: "btn btn-danger",
} as const;

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
}) {
  return <button type={type} className={cn(buttonVariants[variant], className)} {...props} />;
}
