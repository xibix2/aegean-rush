// src/app/[club]/admin/stats/page.tsx
import prisma from "@/lib/prisma";
import { addDays, eachDayOfInterval, format } from "date-fns";
import AdminStatsClient from "@/components/admin/AdminStatsClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type RangeKey = "7" | "30" | "90";

function getRangeDays(searchParams: Record<string, string | string[] | undefined> = {}): number {
  const r = (searchParams.range as string) || "30";
  return (["7", "30", "90"] as RangeKey[]).includes(r as RangeKey) ? Number(r) : 30;
}

export default async function AdminStatsPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // 🔒 tenant + role guard
  const tenant = await requireTenant();
  await requireClubAdminStrict(tenant.id);

  const days = getRangeDays(searchParams);
  const to = new Date();
  const from = addDays(to, -days + 1); // inclusive range

  // Only this club's data
  const bookings = await prisma.booking.findMany({
    where: {
      timeSlot: {
        startAt: { gte: from, lte: to },
        activity: { clubId: tenant.id }, // 🔒 scope to tenant
      },
      status: { in: ["paid", "refunded", "cancelled", "pending"] },
    },
    include: {
      timeSlot: { include: { activity: true } },
      payment: true,
      customer: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const daysList = eachDayOfInterval({ start: from, end: to });
  const byDay = Object.fromEntries(
    daysList.map((d) => [
      format(d, "yyyy-MM-dd"),
      {
        date: format(d, "yyyy-MM-dd"),
        bookings: 0,
        seats: 0,
        capacity: 0,
        revenueCents: 0,
        refundsCents: 0,
        paidBookings: 0,
      },
    ])
  );

  const capacityByDay = new Map<string, Set<string>>();
  const byActivity: Record<
    string,
    { activityId: string; name: string; seats: number; revenueCents: number; bookings: number }
  > = {};

  for (const b of bookings) {
    const key = format(b.timeSlot.startAt, "yyyy-MM-dd");
    const bucket = byDay[key];
    if (!bucket) continue;

    const isPaid = b.status === "paid";
    const isRefunded = b.status === "refunded";
    const party = b.partySize || 0;
    const price = b.totalPrice || 0;

    bucket.bookings += 1;
    bucket.seats += party;

    if (!capacityByDay.has(key)) capacityByDay.set(key, new Set());
    const seen = capacityByDay.get(key)!;
    if (!seen.has(b.timeSlotId)) {
      bucket.capacity += b.timeSlot.capacity || 0;
      seen.add(b.timeSlotId);
    }

    if (isPaid || isRefunded) bucket.revenueCents += price;
    if (isPaid) bucket.paidBookings += 1;
    if (isRefunded) bucket.refundsCents += b.payment?.amount ?? price;

    const akey = b.timeSlot.activityId;
    if (!byActivity[akey]) {
      byActivity[akey] = {
        activityId: akey,
        name: b.timeSlot.activity.name,
        seats: 0,
        revenueCents: 0,
        bookings: 0,
      };
    }
    byActivity[akey].seats += party;
    if (isPaid || isRefunded) byActivity[akey].revenueCents += price;
    byActivity[akey].bookings += 1;
  }

  const totals = Object.values(byDay).reduce(
    (acc, d) => {
      acc.revenueCents += d.revenueCents;
      acc.refundsCents += d.refundsCents;
      acc.seats += d.seats;
      acc.capacity += d.capacity;
      acc.paidBookings += d.paidBookings;
      acc.bookings += d.bookings;
      return acc;
    },
    { revenueCents: 0, refundsCents: 0, seats: 0, capacity: 0, paidBookings: 0, bookings: 0 }
  );

  const utilization = totals.capacity ? totals.seats / totals.capacity : 0;
  const conversion = totals.bookings ? totals.paidBookings / totals.bookings : 0;

  const rangeTabs: Array<{ key: RangeKey; label: string }> = [
    { key: "7", label: "Last 7d" },
    { key: "30", label: "Last 30d" },
    { key: "90", label: "Last 90d" },
  ];

  return (
    <AdminStatsClient
      days={days}
      rangeTabs={rangeTabs}
      byDay={Object.values(byDay)}
      byActivity={Object.values(byActivity)
        .sort((a, b) => b.revenueCents - a.revenueCents)
        .slice(0, 8)}
      totals={totals}
      utilization={utilization}
      conversion={conversion}
    />
  );
}