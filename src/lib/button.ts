import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50";

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent-gradient text-white shadow-accent hover:opacity-90",
  secondary:
    "border border-wtva-dark-300 bg-transparent text-foreground hover:border-accent hover:text-accent",
  ghost: "text-wtva-muted hover:bg-wtva-dark-300 hover:text-foreground",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

/** Canonical button styling for both <button> and <Link>/<a> elements. */
export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}
