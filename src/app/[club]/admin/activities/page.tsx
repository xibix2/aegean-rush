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
  // 🔒 Resolve tenant & guard
  const t = await requireTenant();
  await requireClubAdminStrict(t.id);

  // Derive base prefix from middleware-injected header to keep server & client in sync
  const h = await headers();
  const slug = h.get("x-tenant-slug");
  const basePrefix = slug ? `/${slug}` : "";

  // --- Real data from DB (scoped to tenant) ---
  const activities = await prisma.activity.findMany({
    where: { clubId: t.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      basePrice: true,     // cents
      coverImageUrl: true,
      slug: true,
      active: true,
      durationMin: true,   // minutes
      maxParty: true,      // capacity per slot
      locationId: true,
    },
  });

  const total = activities.length;
  const active = activities.filter((a) => a.active).length;
  const inactive = total - active;
  const avgDuration = total
    ? Math.round(activities.reduce((s, a) => s + (a.durationMin ?? 0), 0) / total)
    : 0;
  const avgCapacity = total
    ? Math.round(activities.reduce((s, a) => s + (a.maxParty ?? 0), 0) / total)
    : 0;

  return (
    <div className="relative mx-auto max-w-6xl px-6 pb-28">
      {/* Header (client, translated) */}
      <ActivitiesHeaderClient />

      {/* Carousel wrapper (outer card only gets the glow) */}
      <section className="rounded-2xl u-border u-surface backdrop-blur-md p-4 sm:p-5 glow-soft">
        <ActivityCarousel activities={activities} basePrefix={basePrefix} />
      </section>

      {/* Stats (client, translated labels) */}
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