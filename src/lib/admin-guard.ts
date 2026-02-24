// src/lib/admin-guard.ts
import { requireTenant } from "@/lib/tenant";
import { getAdminSession, AdminRole } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor(msg = "Unauthorized") {
    super(msg);
  }
}
export class ForbiddenError extends Error {
  constructor(msg = "Forbidden") {
    super(msg);
  }
}

export type GuardedSession = {
  email: string;
  role: AdminRole;
  clubId: string | null; // null for SUPERADMIN
  tenantId: string | null;
};

/** Any logged-in dashboard user (Admin, Manager, Coach, Staff, Superadmin). */
export async function requireAnyAdmin(): Promise<GuardedSession> {
  const s = await getAdminSession();
  if (!s) throw new UnauthorizedError();
  return { email: s.email, role: s.role, clubId: s.clubId, tenantId: null };
}

/** SUPERADMIN only. */
export async function requireSuperAdmin(): Promise<GuardedSession> {
  const s = await getAdminSession();
  if (!s) throw new UnauthorizedError();
  if (s.role !== "SUPERADMIN") throw new ForbiddenError();
  return { email: s.email, role: s.role, clubId: null, tenantId: null };
}

/**
 * Club-scoped member (ANY role for that club) OR SUPERADMIN.
 * If expectedTenantId omitted, resolve via requireTenant().
 *
 * Use this for “safe” pages (dashboard, bookings overview, etc.).
 */
export async function requireClubAdmin(
  expectedTenantId?: string,
): Promise<GuardedSession> {
  const s = await getAdminSession();
  if (!s) throw new UnauthorizedError();

  // SUPERADMIN: allow across all tenants
  if (s.role === "SUPERADMIN") {
    return { email: s.email, role: s.role, clubId: null, tenantId: null };
  }

  // Any club role must match the active tenant
  const tenantId = expectedTenantId ?? (await requireTenant()).id;
  if (!s.clubId || s.clubId !== tenantId) {
    throw new ForbiddenError("Forbidden: tenant mismatch");
  }

  return { email: s.email, role: s.role, clubId: s.clubId, tenantId };
}

/**
 * 🔒 Strict club admin:
 * - SUPERADMIN always allowed
 * - For club users: only ADMIN or MANAGER are allowed
 *
 * Use this on sensitive pages: staff management, settings, billing, etc.
 */
export async function requireClubAdminStrict(
  expectedTenantId?: string,
): Promise<GuardedSession> {
  const base = await requireClubAdmin(expectedTenantId);

  // SUPERADMIN already ok
  if (base.role === "SUPERADMIN") return base;

  if (base.role !== "ADMIN" && base.role !== "MANAGER") {
    throw new ForbiddenError("Insufficient role for this action");
  }

  return base;
}