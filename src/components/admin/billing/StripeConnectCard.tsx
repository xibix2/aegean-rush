// src/components/admin/billing/StripeConnectCard.tsx
"use client";

import { useState } from "react";

type Props = {
  tenantSlug: string;
  isConnected: boolean;
};

export default function StripeConnectCard({ tenantSlug, isConnected }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConnectClick() {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch("/api/billing/connect", {
        method: "POST",
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.error || "Failed to start Stripe onboarding");
      }

      window.location.href = data.url as string;
    } catch (e: any) {
      console.error("[StripeConnectCard] error", e);
      setErr(e?.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 rounded-2xl u-border u-surface p-4 glow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Stripe payouts</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                isConnected
                  ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40"
                  : "bg-amber-500/15 text-amber-200 border border-amber-500/40"
              }`}
            >
              {isConnected ? "Connected" : "Action needed"}
            </span>
          </div>

          <div className="mt-2 text-xs sm:text-sm opacity-80 space-y-2">
            {isConnected ? (
              <>
                <p>
                  Your Stripe account is connected and ready to receive payouts
                  from guest bookings on Aegean Rush.
                </p>
                <p>
                  When a booking is paid, Aegean Rush keeps a 20% platform fee
                  and the remaining 80% is paid out to your connected Stripe
                  account.
                </p>
                <p className="opacity-70">
                  You can reopen Stripe onboarding at any time to update payout
                  details or business information.
                </p>
              </>
            ) : (
              <>
                <p>
                  To receive payouts from guest bookings, you need to connect
                  your Stripe account and complete Stripe&apos;s onboarding flow.
                </p>
                <p>
                  Aegean Rush is free for businesses to use. We only charge a
                  20% commission on completed bookings, and the remaining 80% is
                  paid out to your Stripe account.
                </p>
              </>
            )}
          </div>

          <p className="mt-3 text-[11px] opacity-60">
            Business slug: <strong>{tenantSlug}</strong>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2">
          <button
            type="button"
            onClick={handleConnectClick}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium btn-accent disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "Redirecting to Stripe…"
              : isConnected
              ? "Update Stripe payouts"
              : "Connect Stripe payouts"}
          </button>

          {err && <div className="text-xs text-red-300">❌ {err}</div>}
        </div>
      </div>
    </div>
  );
}