// src/app/[club]/admin/stats/page.tsx
import AdminStatsClient from "@/components/admin/AdminStatsClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import {
  getAdminStats,
  parseStatsRange,
  type StatsRangeKey,
} from "@/lib/admin-stats";
import { getActiveTz } from "@/lib/timezone";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AdminStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ club }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const tenant = await requireTenant(club);
  await requireClubAdminStrict(tenant.id);

  const range = parseStatsRange(resolvedSearchParams.range);
  const timeZone = await getActiveTz();
  const stats = await getAdminStats({
    clubId: tenant.id,
    range,
    timeZone,
  });

  const rangeTabs: StatsRangeKey[] = ["7", "30", "90", "all"];

  return (
    <AdminStatsClient
      range={range}
      rangeTabs={rangeTabs}
      basePath={`/${tenant.slug}/admin/stats`}
      reportPath={`/${tenant.slug}/admin/stats/report`}
      bucketUnit={stats.bucketUnit}
      byPeriod={stats.byPeriod}
      byActivity={stats.byActivity.slice(0, 10)}
      byWeekday={stats.byWeekday}
      totals={stats.totals}
    />
  );
}
