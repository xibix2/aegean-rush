// src/components/ui/Card.tsx
import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // subtle glass card with accent-aware inner hairline
        "card p-5 rounded-2xl border border-[--color-border] bg-[--color-card]/60 backdrop-blur-md",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold tracking-tight",
        // when in dark, keep that soft header gradient look
        "bg-gradient-to-r from-white via-[color-mix(in_oklab,var(--accent-200)_60%,transparent)] to-[color-mix(in_oklab,var(--accent-300)_60%,transparent)] bg-clip-text text-transparent",
        className
      )}
      {...props}
    />
  );
}

export function CardSubtle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm opacity-70", className)} {...props} />;
}