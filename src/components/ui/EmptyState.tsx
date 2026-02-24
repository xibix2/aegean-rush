// src/components/ui/EmptyState.tsx
"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";

type Props = {
  /** When present, internal links are prefixed with /{tenantSlug} */
  tenantSlug?: string;
  /** Optional overrides */
  title?: string;
  subtitle?: string;
  contactEmail?: string;
};

export default function EmptyState({
  tenantSlug,
  title = "No courts are available right now.",
  subtitle = "Need a hand or want to book directly?",
  contactEmail = "info@example.com",
}: Props) {
  // Safely build base path for internal links
  const base = tenantSlug ? `/${tenantSlug}` : "";

  return (
    <section className="space-y-3 text-center">
      {/* local keyframes for a faint pulse */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes es-pulse { 0%,100%{opacity:.75; transform:translateY(0)} 50%{opacity:1; transform:translateY(-1px)} }
          `.trim(),
        }}
      />

      <div
        className="relative mx-auto max-w-2xl rounded-2xl border border-[--color-border] p-10 bg-[--color-card] overflow-hidden"
        role="status"
        aria-live="polite"
      >
        {/* ultra-dim accent wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(70% 120% at 50% -10%, color-mix(in oklab, var(--accent-500), transparent 90%), transparent 70%),
              radial-gradient(60% 120% at 0% 100%,  color-mix(in oklab, var(--accent-600), transparent 92%), transparent 70%),
              radial-gradient(60% 120% at 100% 100%, color-mix(in oklab, var(--accent-600), transparent 92%), transparent 70%)
            `,
          }}
        />

        {/* icon bubble */}
        <div
          className="mx-auto mb-4 grid place-items-center size-12 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--accent-500), black 65%), color-mix(in oklab, var(--accent-600), black 72%))",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.06), 0 10px 28px -18px var(--accent-600)",
            animation: "es-pulse 6s ease-in-out infinite",
          }}
        >
          <CircleHelp className="size-6 text-white/85" />
        </div>

        <p className="text-base opacity-90">{title}</p>
        <p className="text-sm opacity-70 mt-1">{subtitle}</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={`${base}/contact`}
            className="relative inline-flex h-11 items-center rounded-[12px] px-5 font-medium
                       text-[--color-brand-foreground]
                       bg-gradient-to-r from-[--color-brand] to-[var(--accent-500)]
                       hover:shadow-lg hover:shadow-[--accent-600]/30 transition-transform duration-200 active:scale-95"
          >
            Contact us
          </Link>

          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex h-11 items-center rounded-[12px] px-5 font-medium
                       border border-[--color-border] hover:bg-white/5 transition"
          >
            Email support
          </a>
        </div>
      </div>
    </section>
  );
}