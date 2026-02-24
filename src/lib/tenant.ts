// src/lib/tenant.ts
import { cookies, headers } from "next/headers";
import prisma from "@/lib/prisma";

function isValidTenantSlug(slug: string | undefined | null) {
  if (!slug) return false;
  if (slug === "undefined" || slug === "null") return false;
  // same slug rule as middleware
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

export async function resolveTenantSlug(slugOverride?: string) {
  // 1) explicit override (e.g. /[club] route hands it in)
  if (isValidTenantSlug(slugOverride)) return slugOverride;

  const h = await headers();

  // 2) x-tenant-slug header (from middleware)
  const headerSlug = h.get("x-tenant-slug") ?? undefined;
  if (isValidTenantSlug(headerSlug)) return headerSlug;

  // 3) cookie (admin side)
  const c = await cookies();
  const cookieSlug = c.get("tenant_slug")?.value ?? undefined;
  if (isValidTenantSlug(cookieSlug)) return cookieSlug;

  // 4) last resort: parse path’s first segment (best-effort)
  const url = h.get("x-invoke-path") || h.get("next-url") || "";
  const first = url.split("?")[0].split("/").filter(Boolean)[0];
  if (isValidTenantSlug(first)) return first;

  return undefined;
}

export async function requireTenant(slugOverride?: string) {
  const slug = await resolveTenantSlug(slugOverride);
  if (!slug) throw new Error("Tenant not found: no slug");

  try {
    const club = await prisma.club.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        currency: true,
        primaryHex: true,
        logoKey: true,
        subscriptionPlan: true,
      },
    });

    if (!club) throw new Error(`Tenant not found for slug "${slug}"`);
    return club;
  } catch (err: any) {
    const msg =
      process.env.NODE_ENV === "development"
        ? `Database connection failed while fetching tenant "${slug}": ${
            err?.message ?? err
          }`
        : "Service temporarily unavailable";
    throw new Error(msg);
  }
}

/**
 * Soft tenant resolver for global layout / public pages.
 * - Returns `null` instead of throwing when tenant is missing/invalid.
 */
export async function getTenantSoft(slugOverride?: string) {
  try {
    return await requireTenant(slugOverride);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[getTenantSoft] tenant resolution failed:", err);
    }
    return null;
  }
}
