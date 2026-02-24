// src/app/admin/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";
import Sparkline from "@/components/admin/Sparkline";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}
function fmtMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function SuperadminDashboardPage() {
  await requireSuperAdmin();

  const now = new Date();
  const start12 = startOfMonth(addMonths(now, -11));
  const monthKeys: string[] = Array.from({ length: 12 }, (_, i) =>
    fmtMonthKey(addMonths(start12, i))
  );

  const [clubsCount, adminsCount, bookingsCount, revenueAgg, bookingsLastYear, latestClubs] =
    await prisma.$transaction([
      prisma.club.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "succeeded" } }),
      prisma.booking.findMany({
        where: { createdAt: { gte: start12 } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.club.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, slug: true, createdAt: true },
        take: 5,
      }),
    ]);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentDistinctCustomers = await prisma.booking.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { customerId: true },
  });
  const activeCustomers7d = new Set(recentDistinctCustomers.map((b) => b.customerId)).size;

  const byMonth: Record<string, number> = Object.fromEntries(monthKeys.map((k) => [k, 0]));
  for (const b of bookingsLastYear) {
    const k = fmtMonthKey(b.createdAt);
    if (k in byMonth) byMonth[k]++;
  }
  const series = monthKeys.map((k) => byMonth[k]);

  const revenueCents = revenueAgg._sum.amount ?? 0;
  const revenueDisplay = (revenueCents / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  });

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-accent-gradient">Superadmin Dashboard</span>
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-lg u-border u-surface px-3 py-1.5 text-sm hover:u-surface-2"
          >
            ← Back to home
          </Link>
          <Link
            href="/admin/clubs"
            className="inline-flex items-center rounded-lg u-border u-surface px-3 py-1.5 text-sm hover:u-surface-2"
          >
            View Clubs →
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Total Clubs" value={clubsCount} />
        <Kpi title="Admins" value={adminsCount} />
        <Kpi title="Bookings (all time)" value={bookingsCount} />
        <Kpi title="Revenue (all time)" value={revenueDisplay} />
      </section>

      {/* Activity + sparkline */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl u-border u-surface p-5 lg:col-span-2 glow-soft">
          <h3 className="text-lg font-semibold mb-1">Bookings last 12 months</h3>
          <div className="text-xs opacity-70 mb-4">
            {monthKeys[0]} → {monthKeys[monthKeys.length - 1]}
          </div>
          <Sparkline data={series} height={140} strokeWidth={2} dotEvery={3} ariaLabel="Bookings trend chart" />
          <div className="mt-4 flex flex-wrap gap-2 text-xs opacity-80">
            {monthKeys.map((m, i) => (
              <span key={m} className="inline-flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full bg-[var(--accent-500)]" />
                {m}: {series[i]}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl u-border u-surface p-5 glow-soft">
          <h3 className="text-lg font-semibold mb-3">Active customers (last 7d)</h3>
          <div className="text-4xl font-bold">{activeCustomers7d}</div>
          <p className="mt-2 text-sm opacity-75">
            Unique customers who created a booking during the last 7 days.
          </p>
        </div>
      </section>

      {/* Latest clubs */}
      <section className="rounded-2xl u-border u-surface p-5 glow-soft">
        <h3 className="text-lg font-semibold mb-3">Latest clubs</h3>
        <table className="w-full text-sm">
          <thead className="sticky-head">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {latestClubs.map((c) => (
              <tr key={c.id} className="border-t u-border">
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2">{c.slug}</td>
                <td className="px-3 py-2">
                  {new Date(c.createdAt).toLocaleString("en-GB", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </td>
                <td className="px-3 py-2 text-right">
                  <a
                    className="inline-flex items-center rounded-full u-border u-surface px-3 py-1.5 text-xs hover:u-surface-2 transition"
                    href={`/${c.slug}/admin`}
                  >
                    Open admin
                  </a>
                </td>
              </tr>
            ))}
            {latestClubs.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center opacity-70" colSpan={4}>
                  No clubs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl u-border u-surface p-5 glow-soft">
      <div className="text-sm opacity-70">{title}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}