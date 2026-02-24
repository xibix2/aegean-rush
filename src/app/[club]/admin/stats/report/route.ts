// src/app/[club]/admin/stats/report/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, eachDayOfInterval, format } from "date-fns";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import { generateStatsPDF } from "@/lib/reports/generateStatsPdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RANGE_DAYS = 30;

export async function GET() {
  const tenant = await requireTenant();
  await requireClubAdminStrict(tenant.id);

  const to = new Date();
  const from = addDays(to, -RANGE_DAYS + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      timeSlot: {
        startAt: { gte: from, lte: to },
        activity: { clubId: tenant.id },
      },
      status: { in: ["paid", "refunded", "cancelled", "pending"] },
    },
    include: {
      timeSlot: { include: { activity: true } },
      payment: true,
    },
  });

  const days = eachDayOfInterval({ start: from, end: to });
  const byDay = Object.fromEntries(
    days.map((d) => [
      format(d, "yyyy-MM-dd"),
      {
        date: format(d, "yyyy-MM-dd"),
        revenueCents: 0,
        refundsCents: 0,
        seats: 0,
        bookings: 0,
        paidBookings: 0,
      },
    ])
  );

  const byActivity: Record<
    string,
    { name: string; revenueCents: number; seats: number; bookings: number }
  > = {};

  for (const b of bookings) {
    const key = format(b.timeSlot.startAt, "yyyy-MM-dd");
    const bucket = byDay[key];
    if (!bucket) continue;

    const price = b.totalPrice || 0;
    const isPaid = b.status === "paid";
    const isRefunded = b.status === "refunded";

    bucket.bookings++;
    bucket.seats += b.partySize || 0;
    if (isPaid || isRefunded) bucket.revenueCents += price;
    if (isPaid) bucket.paidBookings++;
    if (isRefunded) bucket.refundsCents += price;

    const aid = b.timeSlot.activityId;
    if (!byActivity[aid]) {
      byActivity[aid] = {
        name: b.timeSlot.activity.name,
        revenueCents: 0,
        seats: 0,
        bookings: 0,
      };
    }
    byActivity[aid].revenueCents += price;
    byActivity[aid].seats += b.partySize || 0;
    byActivity[aid].bookings++;
  }

  const totals = Object.values(byDay).reduce(
    (acc, d) => {
      acc.revenueCents += d.revenueCents;
      acc.refundsCents += d.refundsCents;
      acc.seats += d.seats;
      acc.bookings += d.bookings;
      acc.paidBookings += d.paidBookings;
      return acc;
    },
    {
      revenueCents: 0,
      refundsCents: 0,
      seats: 0,
      bookings: 0,
      paidBookings: 0,
    }
  );

  const utilization =
    totals.bookings > 0 ? totals.seats / (totals.bookings * 4) : 0;

  const conversion =
    totals.bookings > 0 ? totals.paidBookings / totals.bookings : 0;

  const pdfBytes = await generateStatsPDF({
    clubName: tenant.name,
    rangeLabel: `Last ${RANGE_DAYS} days`,
    totals: {
      revenue: totals.revenueCents / 100,
      refunds: totals.refundsCents / 100,
      seats: totals.seats,
      paidBookings: totals.paidBookings,
      bookings: totals.bookings,
      utilization,
      conversion,
    },
    byDay: Object.values(byDay).map((d) => ({
      date: d.date,
      revenueCents: d.revenueCents,
      seats: d.seats,
    })),
    byActivity: Object.values(byActivity).map((a) => ({
      name: a.name,
      revenueCents: a.revenueCents,
    })),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="club-report-${tenant.slug}.pdf"`,
    },
  });
}

