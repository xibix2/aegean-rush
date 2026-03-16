// src/components/admin/billing/BillingClient.tsx
"use client";

type PlanKey = "BASIC" | "PRO" | "ENTERPRISE";
type StatusKey = "INACTIVE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export default function BillingClient({
  currentPlan,
  status,
  tenantSlug,
}: {
  currentPlan: PlanKey;
  status: StatusKey;
  tenantSlug: string;
}) {
  return (
    <section className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl u-border u-surface p-5 flex flex-col gap-3 glow-soft lg:col-span-2">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Platform pricing</h2>
              <p className="text-sm opacity-75 mt-1">
                Aegean Rush is free for businesses to join. There is no monthly
                subscription fee.
              </p>
            </div>

            <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-accent text-white">
              Free to join
            </span>
          </header>

          <div className="mt-1 text-2xl font-semibold">20% per booking</div>

          <p className="text-sm opacity-80">
            When a guest books an activity through Aegean Rush, we keep a 20%
            platform fee and transfer the remaining 80% to your connected Stripe
            account.
          </p>

          <ul className="mt-2 space-y-1.5 text-sm opacity-85">
            <li className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-[var(--accent-500)]" />
              <span>No monthly subscription</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-[var(--accent-500)]" />
              <span>No setup fee</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-[var(--accent-500)]" />
              <span>20% platform commission on completed bookings</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-[var(--accent-500)]" />
              <span>80% paid out to your connected Stripe account</span>
            </li>
          </ul>
        </article>

        <article className="rounded-2xl u-border u-surface p-5 flex flex-col gap-3 glow-soft">
          <header>
            <h2 className="text-lg font-semibold">Current account</h2>
            <p className="text-sm opacity-75 mt-1">
              Your legacy plan fields are no longer used for operator billing.
            </p>
          </header>

          <div className="space-y-2 text-sm opacity-85">
            <p>
              <strong>Legacy plan:</strong> {currentPlan}
            </p>
            <p>
              <strong>Legacy status:</strong> {status}
            </p>
            <p className="text-xs opacity-70">
              These values may still exist in the database from the previous
              tennis SaaS model, but businesses now use Aegean Rush for free and
              are charged only through booking commissions.
            </p>
          </div>

          <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs opacity-80">
            <p>
              To receive payouts, connect your Stripe account in the payout
              section below.
            </p>
          </div>
        </article>
      </div>

      <div className="rounded-2xl u-border u-surface p-5 glow-soft">
        <h2 className="text-lg font-semibold">Payouts</h2>
        <p className="mt-1 text-sm opacity-80">
          Connect Stripe to receive your share of guest payments. When a booking
          is completed, Aegean Rush keeps 20% and transfers 80% to your business.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide opacity-60">
              Step 1
            </p>
            <p className="mt-1 text-sm font-medium">Connect your Stripe account</p>
            <p className="mt-1 text-xs opacity-75">
              Complete onboarding so your business can receive payouts.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide opacity-60">
              Step 2
            </p>
            <p className="mt-1 text-sm font-medium">Accept guest bookings</p>
            <p className="mt-1 text-xs opacity-75">
              Guests pay online through your activity checkout flow.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide opacity-60">
              Step 3
            </p>
            <p className="mt-1 text-sm font-medium">Receive 80% payouts</p>
            <p className="mt-1 text-xs opacity-75">
              The platform keeps a 20% fee and sends the rest to your connected
              Stripe account.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs opacity-65">
          Business slug: <strong>{tenantSlug}</strong>
        </p>
      </div>
    </section>
  );
}