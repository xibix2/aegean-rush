// src/components/onboarding/OnboardingBillingClient.tsx
"use client";

import { useState } from "react";

type Plan = "BASIC" | "PRO" | "ENTERPRISE";
type Status = "INACTIVE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

type Props = {
  clubSlug: string;
  clubName: string;
  currentPlan: Plan;
  subscriptionStatus: Status;
};

export default function OnboardingBillingClient({
  clubSlug,
  clubName,
  currentPlan,
  subscriptionStatus,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startConnect() {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch("/api/billing/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok || !data?.url) {
        console.error("[billing/connect] error payload:", data);
        throw new Error(
          data?.error || `Failed to start Stripe onboarding (status ${res.status})`,
        );
      }

      window.location.href = data.url as string;
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong starting Stripe onboarding.");
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <article className="rounded-2xl u-border u-surface p-6 glow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Set up payouts</h2>
            <p className="mt-1 text-sm opacity-75">
              Welcome to Aegean Rush, {clubName}. Your business can use the
              platform for free.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Free to join
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-wide opacity-60">
              Platform fee
            </p>
            <p className="mt-2 text-2xl font-semibold">20%</p>
            <p className="mt-1 text-xs opacity-75">
              Aegean Rush keeps a 20% commission from each completed booking.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-wide opacity-60">
              Your payout
            </p>
            <p className="mt-2 text-2xl font-semibold">80%</p>
            <p className="mt-1 text-xs opacity-75">
              The remaining 80% is transferred to your connected Stripe account.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-wide opacity-60">
              Monthly fee
            </p>
            <p className="mt-2 text-2xl font-semibold">€0</p>
            <p className="mt-1 text-xs opacity-75">
              There is no subscription or setup fee for operators.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold">How it works</h3>
          <ul className="mt-3 space-y-2 text-sm opacity-85">
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]" />
              <span>Connect your Stripe account to receive payouts.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]" />
              <span>Guests book and pay online through Aegean Rush.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]" />
              <span>
                We keep 20% of each completed booking and send 80% to your
                Stripe account.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs opacity-70">
            <p>
              Business slug: <strong>{clubSlug}</strong>
            </p>
            <p>
              Legacy status: <strong>{subscriptionStatus}</strong> · Legacy plan:{" "}
              <strong>{currentPlan}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={startConnect}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-medium btn-accent disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting…" : "Connect Stripe payouts"}
          </button>
        </div>
      </article>
    </section>
  );
}