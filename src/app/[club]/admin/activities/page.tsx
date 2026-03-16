import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import ActivityCarousel from "@/components/ui/ActivityCarousel";
import { ActivitiesHeaderClient } from "@/components/admin/ActivitiesHeaderClient";
import { ActivitiesStatsClient } from "@/components/admin/ActivitiesStatsClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const t = await requireTenant();
  await requireClubAdminStrict(t.id);

  const h = await headers();
  const slug = h.get("x-tenant-slug");
  const basePrefix = slug ? `/${slug}` : "";

  const activities = await prisma.activity.findMany({
    where: { clubId: t.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      basePrice: true,
      coverImageUrl: true,
      slug: true,
      active: true,
      durationMin: true,
      maxParty: true,
      locationId: true,
    },
  });

  const total = activities.length;
  const active = activities.filter((a) => a.active).length;
  const inactive = total - active;

  const avgDuration = total
    ? Math.round(
        activities.reduce((sum, a) => sum + (a.durationMin ?? 0), 0) / total
      )
    : 0;

  const avgCapacity = total
    ? Math.round(
        activities.reduce((sum, a) => sum + (a.maxParty ?? 0), 0) / total
      )
    : 0;

  return (
    <div className="relative mx-auto max-w-6xl px-6 pb-28">
      <ActivitiesHeaderClient />

      <section className="glow-soft rounded-2xl u-border u-surface p-4 backdrop-blur-md sm:p-5">
        <ActivityCarousel activities={activities} basePrefix={basePrefix} />
      </section>

      <ActivitiesStatsClient
        total={total}
        active={active}
        inactive={inactive}
        avgDuration={avgDuration}
        avgCapacity={avgCapacity}
      />
    </div>
  );
}