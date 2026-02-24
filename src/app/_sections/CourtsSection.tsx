// src/app/_sections/CourtsSection.tsx
import prisma from "@/lib/prisma";
import CourtsCarousel from "@/components/ui/CourtsCarousel";
import EmptyState from "@/components/ui/EmptyState";
import { requireTenant } from "@/lib/tenant";
import { headers, cookies } from "next/headers";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// Segments that are NEVER tenant slugs
const RESERVED = new Set([
  "api",
  "admin",
  "login",     // 👈 important for /login
  "privacy",
  "terms",
  "contact",
  // global customer pages
  "activities",
  "timetable",
  "pricing",
  "about",
  "book",
  "export",
  "_next",
]);

function tomorrowYMD() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Best-effort tenant resolution without throwing on non-tenant pages */
async function resolveTenantSlug(explicit?: string) {
  if (explicit) return RESERVED.has(explicit) ? null : explicit;

  const h = await headers();
  const c = await cookies();

  const fromHeader = h.get("x-tenant-slug") || undefined;
  const fromCookie = c.get("tenant_slug")?.value || undefined;

  const slug = fromHeader ?? fromCookie ?? undefined;
  if (!slug || RESERVED.has(slug)) return null;
  return slug;
}

export default async function CourtsSection(props?: { tenantSlug?: string }) {
  // ✅ Only proceed when we have a real tenant slug
  const slug = await resolveTenantSlug(props?.tenantSlug);
  if (!slug) {
    // On non-tenant pages (e.g. /login, /terms), render nothing (or show a soft EmptyState if you prefer)
    return null;
  }

  const tenant = await requireTenant(slug);

  const courts = await prisma.activity.findMany({
    where: { active: true, clubId: tenant.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      basePrice: true,
      locationId: true,
      coverImageUrl: true,
    },
  });

  if (!courts.length) return <EmptyState />;

  return (
    <section className="space-y-3">
      <CourtsCarousel
        courts={courts}
        tomorrow={tomorrowYMD()}
        tenantSlug={tenant.slug}
      />
    </section>
  );
}