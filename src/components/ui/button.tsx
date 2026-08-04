import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-105 shadow-sm border border-transparent",
  secondary:
    "bg-secondary text-foreground hover:bg-[color-mix(in_oklab,var(--secondary)_88%,var(--foreground)_4%)] border border-border",
  ghost: "bg-transparent text-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]",
  outline:
    "bg-transparent text-foreground border border-border hover:border-[color-mix(in_oklab,var(--primary)_50%,var(--border))] hover:text-primary",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-sm rounded-xl gap-2.5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
