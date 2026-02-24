// src/app/admin/page.tsx
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function eurFromCents(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

export default async function SuperAdminHome() {
  await requireSuperAdmin();

  // ----- Time window: last 30 days -----
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ----- Fetch in parallel -----
  const [clubs, admins, bookings] = await Promise.all([
    prisma.club.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, createdAt: true },
    }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.booking.findMany({
      where: {
        createdAt: { gte: from, lte: now },
        status: { in: ["paid", "refunded", "cancelled", "pending"] },
      },
      select: {
        status: true,
        totalPrice: true,
        payment: { select: { status: true, amount: true } },
      },
    }),
  ]);

  // ----- Aggregate last-30d revenue -----
  let paidCents = 0;
  let refundCents = 0;
  let bookingCount = 0;

  for (const b of bookings) {
    bookingCount += 1;
    if (b.status === "paid") {
      paidCents += b.totalPrice || 0;
    } else if (b.status === "refunded") {
      refundCents += b.payment?.amount ?? b.totalPrice ?? 0;
    }
  }

  const netCents = Math.max(0, paidCents - refundCents);
  const recentClubs = clubs.slice(0, 5);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-accent-gradient">Superadmin</span>
        </h1>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center rounded-lg u-border u-surface px-3 py-1.5 text-sm hover:u-surface-2"
          >
            View Dashboard →
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
        <KpiCard label="Total clubs" value={String(clubs.length)} />
        <KpiCard label="Admin users" value={String(admins)} />
        <KpiCard label="Bookings (30d)" value={String(bookingCount)} />
        <KpiCard
          label="Revenue (30d)"
          value={eurFromCents(netCents)}
          sub={`${eurFromCents(paidCents)} paid • ${eurFromCents(refundCents)} refunds`}
        />
      </section>

      {/* Recent clubs */}
      <section className="rounded-2xl u-border u-surface p-5">
        <h2 className="text-lg font-semibold mb-3">Recent clubs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-head">
              <tr>
                <th className="px-3 py-2.5 text-left">Name</th>
                <th className="px-3 py-2.5 text-left">Slug</th>
                <th className="px-3 py-2.5 text-left">Created</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentClubs.map((c) => (
                <tr key={c.id} className="border-t u-border">
                  <td className="px-3 py-2.5">{c.name}</td>
                  <td className="px-3 py-2.5">{c.slug}</td>
                  <td className="px-3 py-2.5">
                    {new Date(c.createdAt).toLocaleString("en-GB", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <a
                      href={`/${c.slug}/admin`}
                      className="inline-flex items-center rounded-lg u-border u-surface px-3 py-1.5 text-xs hover:u-surface-2"
                    >
                      Open admin
                    </a>
                  </td>
                </tr>
              ))}
              {recentClubs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center opacity-70">
                    No clubs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl u-border u-surface p-5">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-semibold tracking-tight mt-1">{value}</div>
      {sub ? <div className="text-xs opacity-60 mt-1">{sub}</div> : null}
    </div>
  );
}