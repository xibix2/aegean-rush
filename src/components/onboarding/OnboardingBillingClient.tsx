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

const plans: {
  id: Plan;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  badge?: string;
}[] = [
  {
    id: "BASIC",
    name: "Basic",
    price: "€39 / month",
    tagline: "Perfect for a single small club getting started.",
    features: [
      "Up to 2 courts",
      "Online bookings",
      "Email confirmations",
      "Basic admin dashboard",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "€79 / month",
    tagline: "For clubs that run multiple weekly sessions.",
    features: [
      "Up to 5 courts",
      "Advanced calendar & exports",
      "Admin roles & staff access",
      "Priority support",
    ],
    badge: "POPULAR",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "€149 / month",
    tagline: "Unlimited courts and premium support.",
    features: [
      "Unlimited courts",
      "Priority onboarding",
      "Monthly performance reports",
      "Direct support channel",
    ],
  },
];

const FOUNDER_CODE_UI = "FOUNDER39"; // for UI/UX only, server still validates

export default function OnboardingBillingClient({
  clubSlug,
  clubName,
  currentPlan,
  subscriptionStatus,
}: Props) {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [founderCode, setFounderCode] = useState<string>("");

  const isActive = subscriptionStatus === "ACTIVE";

  const founderCodeTrimmed = founderCode.trim();
  const founderCodeLooksValid =
    founderCodeTrimmed.length > 0 &&
    founderCodeTrimmed.toUpperCase() === FOUNDER_CODE_UI.toUpperCase();

  async function startCheckout(plan: Plan, founderCodeArg?: string) {
    try {
      setError(null);
      setLoadingPlan(plan);

      const payload: any = { plan };
      if (plan === "ENTERPRISE" && founderCodeArg) {
        payload.founderCode = founderCodeArg;
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok || !data?.url) {
        console.error("[billing/checkout] error payload:", data);
        throw new Error(
          data?.error || `Failed to start checkout (status ${res.status})`,
        );
      }

      window.location.href = data.url as string;
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong starting checkout.");
      setLoadingPlan(null);
    }
  }

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = isActive && currentPlan === p.id;
          const btnLabel = isCurrent ? "Current plan" : "Choose plan";
          const disabled = loadingPlan !== null || isCurrent;

          const isEnterprise = p.id === "ENTERPRISE";

          return (
            <article
              key={p.id}
              className="relative flex flex-col justify-between rounded-2xl u-border u-surface p-5 glow-soft min-h-[260px]"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  {p.badge && (
                    <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pink-200">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-2xl font-semibold">{p.price}</div>
                <p className="mt-1 text-xs opacity-75">{p.tagline}</p>
              </div>

              {/* Features */}
              <ul className="mt-4 space-y-1.5 text-xs opacity-80">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Founder code input only for Enterprise */}
              {isEnterprise && (
                <div className="mt-4 space-y-1 text-xs">
                  <label className="block font-medium opacity-80">
                    Have a founder invite code?
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={founderCode}
                      onChange={(e) => setFounderCode(e.target.value)}
                      placeholder="FOUNDER39"
                      className="h-8 flex-1 rounded-lg border border-white/15 bg-black/40 px-2 text-xs focus:outline-none focus:border-[var(--accent-400)]"
                    />
                  </div>
                  <p
                    className={`text-[11px] ${
                      founderCodeLooksValid
                        ? "text-emerald-300"
                        : "text-white/60"
                    }`}
                  >
                    {founderCodeLooksValid
                      ? "Founder price unlocked — Enterprise for €39/month."
                      : "Enter your founder invite code to unlock the €39/month founder deal."}
                  </p>
                </div>
              )}

              {/* Button + status */}
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    isEnterprise
                      ? startCheckout(p.id, founderCodeTrimmed || undefined)
                      : startCheckout(p.id)
                  }
                  disabled={disabled}
                  className={`inline-flex h-10 items-center justify-center rounded-xl text-sm font-medium transition ${
                    isCurrent
                      ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/60 cursor-default"
                      : "btn-accent w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  }`}
                >
                  {loadingPlan === p.id ? "Redirecting…" : btnLabel}
                </button>

                {!isActive && (
                  <p className="text-[11px] opacity-70">
                    Status: <span className="uppercase">INACTIVE</span>
                  </p>
                )}
                {isCurrent && isActive && (
                  <p className="text-[11px] opacity-70">
                    Status: <span className="uppercase">ACTIVE</span>
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

