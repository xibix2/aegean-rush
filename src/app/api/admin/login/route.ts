// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/auth";
import bcrypt from "bcryptjs";

type Body = {
  username?: string;
  password?: string;
  remember?: boolean; // if true and no session-hours cookie, default to 30d
  tenant?: string | null; // optional explicit tenant slug (from login page)
};

// Best-effort read of tenant slug from header/cookie without throwing
async function readTenantSlugSoft() {
  const h = await headers();
  const c = await cookies();
  return h.get("x-tenant-slug") ?? c.get("tenant_slug")?.value ?? undefined;
}

function isBcryptHash(s: string | null | undefined) {
  return !!s && /^\$2[aby]\$/.test(s);
}

// tiny helper: safe same-site "next" path (no external redirects)
function safePath(s: string | null): string | null {
  if (!s) return null;
  try {
    // Disallow absolute URLs; allow only same-site absolute paths
    if (/^https?:\/\//i.test(s)) return null;
    if (!s.startsWith("/")) return null;
    return s;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Parse body safely
  const {
    username = "",
    password = "",
    remember = false,
    tenant: tenantOverride = null,
  } = ((await req.json().catch(() => ({}))) || {}) as Body;

  const email = String(username).toLowerCase().trim();

  // Optional username enforcement via env for SUPERADMIN
  const requiredUser = process.env.ADMIN_USER?.toLowerCase().trim();

  // Compute session duration
  const jar = await cookies();
  const hoursFromSettings = Number(jar.get("admin_session_hours")?.value || "");
  const fallbackHours = remember ? 24 * 30 : 8; // 30 days or 8 hours
  const hours =
    Number.isFinite(hoursFromSettings) && hoursFromSettings > 0
      ? Math.floor(hoursFromSettings)
      : fallbackHours;
  const clampedHours = Math.max(1, Math.min(24 * 30, hours));
  const maxAge = clampedHours * 60 * 60;

  const common = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/" as const,
    maxAge,
  };

  // read optional ?next= from the query
  const nextParam = safePath(new URL(req.url).searchParams.get("next"));

  /* -------------------------------------------------------
   * 1) SUPERADMIN branch (global creds, no tenant needed)
   * ----------------------------------------------------- */
  const superUserOk = !requiredUser || email === requiredUser;
  const superPassOk = verifyAdminPassword(password);
  if (superUserOk && superPassOk) {
    jar.set("admin_auth", "yes", common);
    jar.set("admin_email", email, common);
    jar.set("admin_role", "SUPERADMIN", common);
    // Ensure no stale tenant-scope for superadmin:
    jar.set("admin_clubId", "", { ...common, maxAge: 0 });
    // Don't set tenant_slug for superadmin (global mode)
    jar.set("tenant_slug", "", { ...common, maxAge: 0 });

    const wantsHtml = (req.headers.get("accept") || "").includes("text/html");
    if (wantsHtml || req.method === "GET") {
      const to = new URL(nextParam || "/admin", req.nextUrl.origin);
      return NextResponse.redirect(to, { status: 303 });
    }
    return NextResponse.json({
      ok: true,
      role: "SUPERADMIN",
      tenant: null,
      redirect: nextParam || "/admin",
    });
  }

  /* -------------------------------------------------------
   * 2) CLUB USER branch
   *    - If tenant slug given (header/cookie/body) → check user in that tenant
   *    - Else, if email matches exactly ONE ADMIN across tenants → pick that tenant
   * ----------------------------------------------------- */

  const softSlug = tenantOverride ?? (await readTenantSlugSoft());

  // Helper: verify a user's password (supports bcrypt or plain)
  const verifyUserSecret = (hashOrPlain: string, input: string) =>
    isBcryptHash(hashOrPlain)
      ? bcrypt.compareSync(input, hashOrPlain)
      : hashOrPlain === input;

  let user:
    | {
        id: string;
        role: string;
        clubId: string | null;
        password: string;
      }
    | null = null;
  let clubSlugToSet: string | null = null;

  if (softSlug) {
    // ✅ Login scoped to a specific club
    const club = await prisma.club.findUnique({
      where: { slug: softSlug },
      select: { id: true, slug: true },
    });
    if (!club) {
      return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });
    }

    // Allow ADMIN + MANAGER + COACH + STAFF for this club
    const u = await prisma.user.findFirst({
      where: {
        email,
        clubId: club.id,
        role: { in: ["ADMIN", "MANAGER", "COACH", "STAFF"] },
      },
      select: { id: true, role: true, clubId: true, password: true },
    });

    if (!u || !verifyUserSecret(u.password, password)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    user = u;
    clubSlugToSet = club.slug;
  } else {
    // No tenant specified: keep this stricter and only allow ADMINs
    const users = await prisma.user.findMany({
      where: { email, role: "ADMIN" },
      select: {
        id: true,
        role: true,
        clubId: true,
        password: true,
        club: { select: { slug: true } },
      },
    });

    // Filter those whose password matches
    const matches = users.filter((u) =>
      verifyUserSecret(u.password, password),
    );

    if (matches.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }
    if (matches.length > 1) {
      // Ambiguous: same email/password on multiple tenants → require tenant choice
      return NextResponse.json(
        {
          error:
            "Multiple clubs found for this user. Please specify tenant.",
          needTenant: true,
        },
        { status: 409 },
      );
    }

    const only = matches[0];
    user = {
      id: only.id,
      role: only.role,
      clubId: only.clubId,
      password: only.password,
    };
    clubSlugToSet = (only as any).club?.slug ?? null;
  }

  // Safety check
  if (!user || !user.clubId || !clubSlugToSet) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  // Issue cookies for club user.
  // NOTE: for now we still store "ADMIN" as role in the cookie so that the
  // existing guards keep working. We’ll tighten this later when we add
  // real per-role permissions.
  jar.set("admin_auth", "yes", common);
  jar.set("admin_email", email, common);
  jar.set("admin_role", user.role as any, common); // "ADMIN" | "MANAGER" | "COACH" | "STAFF"
  jar.set("admin_clubId", user.clubId, common);
  jar.set("tenant_slug", clubSlugToSet, common);

  const wantsHtml = (req.headers.get("accept") || "").includes("text/html");
  const tenantBase = `/${clubSlugToSet}`;
  const adminHome = `${tenantBase}/admin`;
  const redirectPath = nextParam ? `${tenantBase}${nextParam}` : adminHome;

  if (wantsHtml || req.method === "GET") {
    const to = new URL(redirectPath, req.nextUrl.origin);
    return NextResponse.redirect(to, { status: 303 });
  }
  return NextResponse.json({
    ok: true,
    role: "ADMIN",
    tenant: clubSlugToSet,
    redirect: redirectPath,
  });
}