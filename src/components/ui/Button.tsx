// src/components/ui/Button.tsx
"use client";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  asChild,
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  const Comp = asChild ? Slot : "button";

  const base =
    "inline-flex items-center justify-center font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-[12px]";

  const sizes =
    {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-4 text-base",
      lg: "h-12 px-6 text-base",
    }[size] || "h-11 px-4 text-base";

  // Accent-aware variants (no hardcoded pinks)
  const variants =
    {
      primary:
        "text-white shadow-md " +
        "bg-[--accent-500] hover:bg-[--accent-600] " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-400]/60",
      secondary:
        "bg-[--color-muted] text-[--color-foreground] hover:bg-[--color-muted]/90 " +
        "border border-[--color-border] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-400]/40",
      ghost:
        "bg-transparent hover:bg-[--color-muted]/60 " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-400]/40",
    }[variant] || "";

  return <Comp className={cn(base, sizes, variants, className)} {...props} />;
}