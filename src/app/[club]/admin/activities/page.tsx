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
      minParty: true,
      maxParty: true,
      locationId: true,
      mode: true,
      guestsPerUnit: true,
      maxUnitsPerBooking: true,
      durationOptions: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          label: true,
          durationMin: true,
          priceCents: true,
        },
      },
    },
  });

  const total = activities.length;
  const active = activities.filter((a) => a.active).length;
  const inactive = total - active;

  const fixedCount = activities.filter(
    (a) => a.mode === "FIXED_SEAT_EVENT"
  ).length;

  const rentalCount = activities.filter(
    (a) => a.mode === "DYNAMIC_RENTAL"
  ).length;

  const hybridCount = activities.filter(
    (a) => a.mode === "HYBRID_UNIT_BOOKING"
  ).length;

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
        fixedCount={fixedCount}
        rentalCount={rentalCount}
        hybridCount={hybridCount}
      />
    </div>
  );
}