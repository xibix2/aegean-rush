// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Top-level segments that are NOT tenant slugs
const RESERVED = new Set([
  "api",
  "clubs",
  "admin",
  "login",
  "forgot-password",
  "reset-password",
  "signup",
  "privacy",
  "terms",
  "contact",
  "timetable",
  "pricing",
  "about",
  "book",
  "export",
  "_next",
  "onboarding",
  
  // prevent these from being treated as tenant slugs
  "activities",
  "courts",
  "locations",
]);

function isStaticPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

function isValidTenantSlug(slug: string | undefined | null) {
  if (!slug) return false;
  if (slug === "undefined" || slug === "null") return false;
  if (RESERVED.has(slug)) return false;
  // typical slug: mountain-view-tennis
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

function redirectToLogin(
  req: NextRequest,
  tenant?: string | null,
  nextPath?: string,
) {
  const url = new URL("/login", req.url); // canonical login
  if (tenant) url.searchParams.set("tenant", tenant);
  if (nextPath) url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url, { status: 303 });
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isStaticPath(pathname)) return NextResponse.next();

  const segs = pathname.split("/").filter(Boolean);
  const cookies = req.cookies;

  const authYes = cookies.get("admin_auth")?.value === "yes"; // legacy flag
  const hasSession = !!cookies.get("admin_session")?.value; // signed token (optional)
  const adminRoleCookie = cookies.get("admin_role")?.value || "";
  const isSuperAdmin = adminRoleCookie === "SUPERADMIN";
  const isAuthed = authYes || hasSession || !!adminRoleCookie;

  // If cookie is poisoned, clear it aggressively
  const cookieTenant = cookies.get("tenant_slug")?.value;
  const hasPoisonedTenantCookie =
    cookieTenant === "undefined" || cookieTenant === "null";

  /* ============================================================
     0) ROOT HOMEPAGE: neutral branding (no tenant for server)
     ============================================================ */
  if (pathname === "/") {
    const headers = new Headers(req.headers);
    const cookieHeader = headers.get("cookie");
    if (cookieHeader && cookieHeader.includes("tenant_slug=")) {
      const filtered = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .filter((c) => !c.startsWith("tenant_slug="))
        .join("; ");
      if (filtered) headers.set("cookie", filtered);
      else headers.delete("cookie");
    }

    const res = NextResponse.next({ request: { headers } });
    res.headers.delete("x-tenant-slug");

    // clear poisoned cookie on /
    if (hasPoisonedTenantCookie) {
      res.cookies.set("tenant_slug", "", { path: "/", maxAge: 0, sameSite: "lax" });
    }

    return res;
  }

  /* ============================================================
     0) LET LOGIN API POST REQUESTS THROUGH (no redirects!)
     ============================================================ */
  if (pathname === "/api/admin/login" && req.method === "POST") {
    return NextResponse.next();
  }
  if (
    req.method === "POST" &&
    segs.length >= 4 &&
    !RESERVED.has(segs[0]) &&
    segs[1] === "api" &&
    segs[2] === "admin" &&
    segs[3] === "login"
  ) {
    return NextResponse.next();
  }

  /* ============================================================
     A) Canonicalize legacy login URLs (GET only)
     ============================================================ */
  if (pathname === "/api/admin/login" && req.method === "GET") {
    const url = new URL("/login", req.url);
    for (const [k, v] of req.nextUrl.searchParams.entries())
      url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 307 });
  }

  if (
    req.method === "GET" &&
    segs.length >= 4 &&
    !RESERVED.has(segs[0]) &&
    segs[1] === "api" &&
    segs[2] === "admin" &&
    segs[3] === "login"
  ) {
    const tenantSlug = segs[0];
    const url = new URL("/login", req.url);
    if (isValidTenantSlug(tenantSlug)) url.searchParams.set("tenant", tenantSlug);
    for (const [k, v] of req.nextUrl.searchParams.entries())
      url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 307 });
  }

  if (pathname === "/admin/login") {
    const url = new URL("/login", req.url);
    for (const [k, v] of req.nextUrl.searchParams.entries())
      url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 307 });
  }

  /* ============================================================
     B) Central /login
     ============================================================ */
  if (pathname === "/login") {
    if (isAuthed) {
      const tenant = cookies.get("tenant_slug")?.value || null;

      // SUPERADMIN → /admin
      if (isSuperAdmin) {
        const destUrl = new URL("/admin", req.url);
        const res = NextResponse.redirect(destUrl, { status: 303 });
        if (hasPoisonedTenantCookie) {
          res.cookies.set("tenant_slug", "", { path: "/", maxAge: 0, sameSite: "lax" });
        }
        return res;
      }

      // Club admin with remembered tenant → /{tenant}/admin (only if valid)
      if (isValidTenantSlug(tenant)) {
        const destUrl = new URL(`/${tenant}/admin`, req.url);
        const res = NextResponse.redirect(destUrl, { status: 303 });
        return res;
      }

      // Authed but no valid tenant: clear stale admin cookies and show login
      const res = NextResponse.next();
      res.cookies.set("admin_auth", "", { path: "/", maxAge: 0, sameSite: "lax" });
      res.cookies.set("admin_session", "", { path: "/", maxAge: 0, sameSite: "lax" });
      res.cookies.set("admin_role", "", { path: "/", maxAge: 0, sameSite: "lax" });

      // clear poisoned tenant cookie
      if (hasPoisonedTenantCookie) {
        res.cookies.set("tenant_slug", "", { path: "/", maxAge: 0, sameSite: "lax" });
      }

      return res;
    }

    // even unauth: clear poisoned cookie if present
    if (hasPoisonedTenantCookie) {
      const res = NextResponse.next();
      res.cookies.set("tenant_slug", "", { path: "/", maxAge: 0, sameSite: "lax" });
      return res;
    }

    return NextResponse.next();
  }

  /* ============================================================
     B2) Normalize /admin[...] -> /{tenant}/admin[...] (not for superadmin)
     ============================================================ */
  if (pathname.startsWith("/admin") && isAuthed && !isSuperAdmin) {
    const slug = cookies.get("tenant_slug")?.value;
    if (isValidTenantSlug(slug)) {
      const dest = new URL(`/${slug}${pathname}`, req.url);
      dest.search = req.nextUrl.search;
      return NextResponse.redirect(dest, { status: 307 });
    }
  }

  /* ============================================================
     C) Tenant-scoped admin: /{slug}/admin[...]
     ============================================================ */
  if (segs.length >= 1 && isValidTenantSlug(segs[0])) {
    const tenantSlug = segs[0];
    const second = segs[1] || "";

    if (second === "admin" && segs[2] === "login") {
      return redirectToLogin(req, tenantSlug);
    }

    if (second === "admin") {
      if (!isAuthed) {
        const original = `${pathname}${search || ""}`;
        return redirectToLogin(req, tenantSlug, original);
      }

      const headers = new Headers(req.headers);
      headers.set("x-tenant-slug", tenantSlug);

      const res = NextResponse.next({ request: { headers } });
      res.cookies.set("tenant_slug", tenantSlug, { path: "/", sameSite: "lax" });

      // clear poisoned cookie if existed
      if (hasPoisonedTenantCookie) {
        res.cookies.set("tenant_slug", tenantSlug, { path: "/", sameSite: "lax" });
      }

      return res;
    }
  }

  /* ============================================================
     D) Global /admin[...] guard
     ============================================================ */
  if (pathname.startsWith("/admin")) {
    if (!isAuthed) {
      const original = `${pathname}${search || ""}`;
      return redirectToLogin(req, undefined, original);
    }
    return NextResponse.next();
  }

  /* ============================================================
     E) Tenant-prefixed API rewrite: /{tenant}/api/* -> /api/*
     ============================================================ */
  if (segs.length >= 2 && isValidTenantSlug(segs[0]) && segs[1] === "api") {
    const slug = segs[0];

    const apiPath = "/" + segs.slice(1).join("/");
    const url = new URL(apiPath + (search || ""), req.url);

    const headers = new Headers(req.headers);
    headers.set("x-tenant-slug", slug);

    const res = NextResponse.rewrite(url, { request: { headers } });
    res.cookies.set("tenant_slug", slug, { path: "/", sameSite: "lax" });
    return res;
  }

  /* ============================================================
     F) Tenant header injection (no path rewrite)
     ============================================================ */
  if (segs.length >= 1 && isValidTenantSlug(segs[0])) {
    const slug = segs[0];

    const headers = new Headers(req.headers);
    headers.set("x-tenant-slug", slug);

    const res = NextResponse.next({ request: { headers } });
    res.cookies.set("tenant_slug", slug, { path: "/", sameSite: "lax" });
    return res;
  }

  /* ============================================================
     G) Global/reserved routes: ensure we don't pass a tenant header
     ============================================================ */
  const res = NextResponse.next();
  res.headers.delete("x-tenant-slug");

  // clear poisoned cookie on any non-tenant route too
  if (hasPoisonedTenantCookie) {
    res.cookies.set("tenant_slug", "", { path: "/", maxAge: 0, sameSite: "lax" });
  }

  return res;
}

// One matcher for everything except built assets and direct files
export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};