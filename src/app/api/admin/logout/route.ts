import { NextRequest, NextResponse } from "next/server";

function buildClearedResponse(target: URL) {
  const res = NextResponse.redirect(target, { status: 303 });

  // mirror the attributes used on login
  const common = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/" as const,
    maxAge: 0,
  };

  // Auth + tenant pins
  res.cookies.set("admin_auth", "", common);
  res.cookies.set("admin_email", "", common);
  res.cookies.set("admin_role", "", common);
  res.cookies.set("admin_clubId", "", common);
  res.cookies.set("tenant_slug", "", common);

  // legacy/cleanup
  res.cookies.set("admin", "", { path: "/", httpOnly: true, maxAge: 0 });

  // (optional) clear global UI cookies too; namespaced ones (ui_*__{slug}) have path="/{slug}"
  // so they won’t be cleared here and that’s fine (they don’t affect routing).
  res.cookies.set("ui_theme", "", { ...common, httpOnly: false });
  res.cookies.set("ui_accent", "", { ...common, httpOnly: false });
  res.cookies.set("ui_lang", "", { ...common, httpOnly: false });
  res.cookies.set("ui_currency", "", { ...common, httpOnly: false });
  res.cookies.set("ui_compact", "", { ...common, httpOnly: false });

  return res;
}

// Always send users to canonical /login (no slug, no next) to avoid “sticky” tenant
function targetLoginUrl(req: NextRequest): URL {
  return new URL("/login", req.nextUrl.origin);
}

function wantsHtml(req: NextRequest): boolean {
  const accept = req.headers.get("accept") || "";
  const ct = req.headers.get("content-type") || "";
  return (
    accept.includes("text/html") ||
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  );
}

export async function POST(req: NextRequest) {
  const target = targetLoginUrl(req);
  return buildClearedResponse(target);
}

export async function GET(req: NextRequest) {
  const target = targetLoginUrl(req);
  return buildClearedResponse(target);
}