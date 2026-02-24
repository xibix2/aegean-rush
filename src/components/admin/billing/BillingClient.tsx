// src/components/admin/billing/BillingClient.tsx
"use client";

import { useState } from "react";

type PlanKey = "BASIC" | "PRO" | "ENTERPRISE";
type StatusKey = "INACTIVE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

const PLANS: {
  key: PlanKey;
  label: string;
  priceLabel: string;
  description: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    key: "BASIC",
    label: "Basic",
    priceLabel: "€39 / month",
    description: "Perfect for a single small club getting started.",
    features: [
      "Up to 2 courts",
      "Online bookings",
      "Email confirmations",
      "Basic admin dashboard",
    ],
  },
  {
    key: "PRO",
    label: "Pro",
    priceLabel: "€79 / month",
    description: "For serious clubs that live in their schedule.",
    features: [
      "Up to 5 courts",
      "Advanced calendar & exports",
      "Admin roles & staff access",
      "Priority support",
    ],
    highlight: true,
  },
  {
    key: "ENTERPRISE",
    label: "Enterprise",
    priceLabel: "€149 / month",
    description: "Unlimited courts and premium support.",
    features: [
      "Unlimited courts",
      "Priority onboarding",
      "Monthly performance reports",
      "Direct support channel",
    ],
  },
];

export default function BillingClient({
  currentPlan,
  status,
  tenantSlug,
}: {
  currentPlan: PlanKey;
  status: StatusKey;
  tenantSlug: string;
}) {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const isActive = status === "ACTIVE" || status === "TRIALING";

  async function startCheckout(plan: PlanKey) {
    if (loadingPlan) return;
    setLoadingPlan(plan);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        console.error("Checkout error", await res.text());
        alert("Could not start checkout. Please try again.");
        setLoadingPlan(null);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Could not start checkout. Please try again.");
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error("Checkout error", err);
      alert("Unexpected error. Please try again.");
      setLoadingPlan(null);
    }
  }

  async function cancelSubscription() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? Your access will be revoked immediately and you will not be charged again.",
    );
    if (!confirmed) return;

    try {
      setCancelLoading(true);

      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ immediate: true }),
      });

      if (!res.ok) {
        console.error("Cancel error", await res.text());
        alert(
          "Subscription cancellation failed. Please try again.",
        );
        setCancelLoading(false);
        return;
      }

      const data = (await res.json().catch(() => ({} as any))) as {
        ok?: boolean;
        error?: string;
      };

      if (!data.ok) {
        console.error("Cancel error payload", data);
        alert(
          data.error ||
            "Subscription cancellation failed. Please try again.",
        );
        setCancelLoading(false);
        return;
      }

      alert(
        "Your subscription has been canceled. Your access will be revoked shortly.",
      );

      // Refresh so status/plan update via webhook + DB
      window.location.reload();
    } catch (err) {
      console.error("Cancel error", err);
      alert("Something went wrong. Please try again.");
      setCancelLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      {/* Existing grid of plans (unchanged logic) */}
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          const disabled = (isCurrent && isActive) || cancelLoading;
          const isLoading = loadingPlan === plan.key;

          return (
            <article
              key={plan.key}
              className={`rounded-2xl u-border u-surface p-5 flex flex-col gap-3 glow-soft ${
                plan.highlight ? "border-accent" : ""
              }`}
            >
              <header className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{plan.label}</h2>
                  <p className="text-sm opacity-75 mt-1">
                    {plan.description}
                  </p>
                </div>
                {plan.highlight && (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-accent text-white">
                    Popular
                  </span>
                )}
              </header>

              <div className="mt-1 text-2xl font-semibold">
                {plan.priceLabel}
              </div>

              <ul className="mt-2 space-y-1.5 text-sm opacity-85">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="inline-block size-1.5 rounded-full bg-[var(--accent-500)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex-1" />

              <button
                type="button"
                onClick={() => startCheckout(plan.key)}
                disabled={disabled || isLoading}
                className="w-full inline-flex items-center justify-center rounded-xl h-10 text-sm font-medium btn-accent disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {disabled
                  ? "Current plan"
                  : isLoading
                  ? "Redirecting…"
                  : isActive && plan.key !== currentPlan
                  ? "Change plan"
                  : "Choose plan"}
              </button>

              {isCurrent && (
                <p className="mt-1 text-[11px] opacity-70 text-center">
                  Current status: <strong>{status}</strong>
                </p>
              )}
            </article>
          );
        })}
      </div>

      {/* Cancel subscription block – only when there *is* an active/trial sub */}
      {isActive && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/5 px-4 py-3 flex flex-col gap-2 text-xs text-red-100/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-200">
                Cancel subscription
              </p>
              <p className="mt-1 text-[11px] text-red-100/80">
                You can cancel your subscription at any time. Your access to TennisPro will stop immediately and you will not be charged again.
              </p>
            </div>
            <button
              type="button"
              onClick={cancelSubscription}
              disabled={cancelLoading}
              className="inline-flex items-center justify-center rounded-xl border border-red-500/70 px-3 py-1.5 text-[11px] font-semibold text-red-100 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cancelLoading ? "Cancelling…" : "Cancel subscription"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}