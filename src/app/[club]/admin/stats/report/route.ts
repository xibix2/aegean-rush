import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import { generateStatsPDF } from "@/lib/reports/generateStatsPdf";
import { getAdminStats, parseStatsRange } from "@/lib/admin-stats";
import { getActiveTz } from "@/lib/timezone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ club: string }> }
) {
  const { club } = await params;
  const tenant = await requireTenant(club);
  await requireClubAdminStrict(tenant.id);

  const range = parseStatsRange(
    request.nextUrl.searchParams.get("range") ?? undefined
  );
  const stats = await getAdminStats({
    clubId: tenant.id,
    range,
    timeZone: await getActiveTz(),
  });

  const pdfBytes = await generateStatsPDF({
    clubName: tenant.name,
    brandColor: tenant.primaryHex ?? undefined,
    rangeLabel: stats.rangeLabel,
    totals: {
      revenue: stats.totals.revenueCents / 100,
      onlineRevenue: stats.totals.onlineNetRevenueCents / 100,
      walkInRevenue: stats.totals.walkInNetRevenueCents / 100,
      refunds: stats.totals.refundsCents / 100,
      seats: stats.totals.seats,
      paidBookings: stats.totals.paidBookings,
      bookings: stats.totals.bookings,
      utilization: stats.totals.utilization,
      conversion: stats.totals.conversion,
    },
    byDay: stats.byPeriod.map((period) => ({
      date: period.label,
      revenueCents: period.netRevenueCents,
      seats: period.seats,
    })),
    byActivity: stats.byActivity.map((activity) => ({
      name: activity.name,
      revenueCents: activity.netRevenueCents,
    })),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="business-report-${tenant.slug}-${range}.pdf"`,
    },
  });
}
