// src/app/[club]/admin/billing/page.tsx
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import BillingClient from "@/components/admin/billing/BillingClient";
import StripeConnectCard from "@/components/admin/billing/StripeConnectCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const tenant = await requireTenant();
  await requireClubAdminStrict(tenant.id);

  const club = await prisma.club.findUnique({
    where: { id: tenant.id },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      slug: true,
      name: true,
      stripeConnectAccountId: true,
    },
  });

  if (!club) {
    throw new Error("Business not found");
  }

  const justConnected = searchParams?.connected === "1";
  const connectCanceled = searchParams?.connectCanceled === "1";
  const connectError =
    typeof searchParams?.connectError === "string"
      ? (searchParams.connectError as string)
      : undefined;

  const isConnected = !!club.stripeConnectAccountId;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-accent-gradient">Billing</span>
          </h1>
          <p className="mt-1 text-sm opacity-70">
            Manage your subscription and payouts for <strong>{club.name}</strong>.
          </p>
        </div>

        <a
          href={`/${club.slug}/admin`}
          className="inline-flex items-center rounded-full u-border u-surface px-3 py-1.5 text-sm hover:u-surface-2 transition"
        >
          ← Back to dashboard
        </a>
      </header>

      {justConnected && (
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 flex items-center justify-between gap-3">
          <span>
            ✅ <strong>Stripe payouts connected.</strong> Future booking payments
            will be routed to your Stripe account.
          </span>
        </div>
      )}

      {connectCanceled && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          ⚠️ Stripe onboarding was cancelled. You can restart it anytime below.
        </div>
      )}

      {connectError && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          ❌ Stripe connection error: {connectError}
        </div>
      )}

      <BillingClient
        currentPlan={club.subscriptionPlan}
        status={club.subscriptionStatus}
        tenantSlug={club.slug}
      />

      <section className="rounded-2xl u-border u-surface p-5 glow-soft space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold opacity-85">
              Payouts via Stripe
            </h2>
            <p className="mt-1 text-xs sm:text-sm opacity-70 max-w-md">
              Connect your own Stripe account so booking payments can be paid
              out directly to your business.
            </p>
          </div>

          <div
            className={
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium " +
              (isConnected
                ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/60"
                : "bg-red-500/10 text-red-200 border border-red-500/60")
            }
          >
            {isConnected ? "Connected" : "Not connected"}
          </div>
        </div>

        <StripeConnectCard tenantSlug={club.slug} isConnected={isConnected} />
      </section>
    </main>
  );
}