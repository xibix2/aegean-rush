import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/tenant/switch?slug=city-racket
 * Body may also include { slug } as JSON or form-data.
 * Sets a `tenant_slug` cookie after verifying the club exists.
 */
export async function POST(req: NextRequest) {
  // 1) read slug from query, then JSON, then form
  const url = new URL(req.url);
  let slug = url.searchParams.get("slug") ?? "";

  if (!slug) {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      slug = (body?.slug as string) || "";
    } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await req.formData();
      slug = (form.get("slug") as string) || "";
    }
  }

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  // 2) verify the club exists
  const club = await prisma.club.findUnique({ where: { slug }, select: { slug: true, name: true } });
  if (!club) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // 3) set cookie (1 year)
  const res = NextResponse.json({ ok: true, slug: club.slug, name: club.name });
  const isSecure = req.nextUrl.protocol === "https:";
  res.cookies.set("tenant_slug", club.slug, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}