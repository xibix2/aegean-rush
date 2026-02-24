// src/app/[club]/admin/page.tsx
import { AdminHeaderClient } from "@/components/admin/AdminHeaderClient";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { DEFAULT_TZ, formatYMDInTz } from "@/lib/timezone";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ClubAdminPage({
  params,
}: {
  params: { club: string };
}) {
  // Resolve tenant from the dynamic segment and guard
  const tenant = await requireTenant(params.club);

  // pull the club's tz once on the server
  const setting = await prisma.appSetting.findUnique({
    where: { clubId: tenant.id },
    select: { tz: true },
  });
  const tz = setting?.tz || DEFAULT_TZ;

  const todayIso = formatYMDInTz(new Date(), tz); // YYYY-MM-DD in club TZ

  return (
    <main className="p-6 space-y-8 text-center">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes adminTitlePulse { 0%,100%{opacity:1; transform:none} 50%{opacity:.92; transform:translateY(-1px)} }
@keyframes adminGlowLine { 0%,100%{opacity:.55; transform:scaleX(.9)} 50%{opacity:.95; transform:scaleX(1)} }
@media (prefers-reduced-motion: reduce){ .t-anim { animation: none !important; } }
          `.trim(),
        }}
      />
      <AdminHeaderClient />
      <AdminDashboardClient initialDate={todayIso} />
    </main>
  );
}