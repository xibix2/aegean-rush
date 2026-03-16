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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start Stripe onboarding");
      }

      const data = (await res.json()) as { ok: boolean; url?: string };
      if (!data.ok || !data.url) {
        throw new Error("No redirect URL from Stripe");
      }

      // Redirect to Stripe-hosted onboarding
      window.location.href = data.url;
    } catch (e: any) {
      console.error("[StripeConnectCard] error", e);
      setErr(e?.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="text-xs sm:text-sm opacity-75 max-w-md">
        {isConnected ? (
          <>
            Your Stripe account is connected. You can update payout details or
            business information from your Stripe dashboard. If you need to reconnect,
            you can restart onboarding below.
          </>
        ) : (
          <>
            To receive payments from bookings, you must complete Stripe&apos;s
            onboarding flow and connect a payout account.
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleConnectClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium btn-accent disabled:opacity-60"
      >
        {loading
          ? "Redirecting to Stripe…"
          : isConnected
          ? "Manage Stripe payouts"
          : "Connect Stripe payouts"}
      </button>

      {err && (
        <div className="w-full text-xs text-red-300 mt-2">
          ❌ {err}
        </div>
      )}
    </div>
  );
}