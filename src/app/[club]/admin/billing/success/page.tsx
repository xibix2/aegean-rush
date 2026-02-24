import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BillingSuccessPage() {
  // 🔒 Make sure this is a real club admin
  const tenant = await requireTenant();
  await requireClubAdmin(tenant.id);

  // Pull latest subscription info to show what they now have
  const club = await prisma.club.findUnique({
    where: { id: tenant.id },
    select: {
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  const planLabel = club?.subscriptionPlan ?? "BASIC";
  const statusLabel = club?.subscriptionStatus ?? "ACTIVE";

  const baseAdmin = `/${tenant.slug}/admin`;

  return (
    <main className="max-w-xl mx-auto p-6">
      <section className="rounded-2xl u-border u-surface p-6 md:p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium bg-[color-mix(in_oklab,var(--accent-500)_20%,transparent)] text-[var(--accent-200)]">
          Payment successful
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-accent-gradient">You’re all set</span>
        </h1>

        <p className="text-sm md:text-base opacity-75 max-w-md mx-auto">
          Your subscription for <strong>{club?.name ?? "your club"}</strong>{" "}
          is now active. You can start managing bookings and courts right away
          from your admin dashboard.
        </p>

        <div className="mt-4 inline-flex flex-col items-center gap-1 text-xs opacity-70">
          <div>
            Current plan:{" "}
            <span className="font-medium">
              {planLabel.charAt(0) + planLabel.slice(1).toLowerCase()}
            </span>
          </div>
          <div>
            Status: <span className="font-medium">{statusLabel}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href={`${baseAdmin}`}
            className="inline-flex items-center justify-center rounded-xl h-11 px-5 text-sm font-medium btn-accent"
          >
            Go to dashboard
          </Link>
          <Link
            href={`${baseAdmin}/billing`}
            className="inline-flex items-center justify-center rounded-xl h-11 px-4 text-sm opacity-80 hover:opacity-100 u-border u-surface"
          >
            Review my billing
          </Link>
        </div>
      </section>
    </main>
  );
}
