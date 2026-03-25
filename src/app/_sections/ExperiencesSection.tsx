// src/app/_sections/ExperiencesSection.tsx
import prisma from "@/lib/prisma";
import ExperiencesCarousel from "@/components/ui/ExperiencesCarousel";
import EmptyState from "@/components/ui/EmptyState";
import { requireTenant } from "@/lib/tenant";
import { headers, cookies } from "next/headers";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const RESERVED = new Set([
  "api",
  "admin",
  "login",
  "privacy",
  "terms",
  "contact",
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

export default async function ExperiencesSection(props?: { tenantSlug?: string }) {
  const slug = await resolveTenantSlug(props?.tenantSlug);
  if (!slug) return null;

  const tenant = await requireTenant(slug);

  const experiences = await prisma.activity.findMany({
    where: { active: true, clubId: tenant.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      basePrice: true,
      mode: true,
      durationMin: true,
      locationId: true,
      coverImageUrl: true,
    },
  });

  return (
    <section className="relative">
      {!experiences.length ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
          <EmptyState />
        </div>
      ) : (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 sm:p-4 md:p-5 backdrop-blur-xl shadow-[0_20px_80px_-40px_rgba(0,0,0,0.65)]">
          <ExperiencesCarousel
            courts={experiences}
            tomorrow={tomorrowYMD()}
            tenantSlug={tenant.slug}
          />
        </div>
      )}
    </section>
  );
}