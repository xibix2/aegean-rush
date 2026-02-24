// src/app/api/admin/clubs/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/clubs  (SUPERADMIN only)
export async function GET() {
  try {
    await requireSuperAdmin();

    const clubs = await prisma.club.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        currency: true,
        primaryHex: true,
        createdAt: true,
        _count: { select: { activities: true, customers: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // cheap booking counts per club
    const acts = await prisma.activity.findMany({ select: { id: true, clubId: true } });
    const byClub: Record<string, string[]> = {};
    for (const a of acts) (byClub[a.clubId] ||= []).push(a.id);

    const bookingCounts: Record<string, number> = {};
    for (const clubId of Object.keys(byClub)) {
      bookingCounts[clubId] = await prisma.booking.count({
        where: { activityId: { in: byClub[clubId] } },
      });
    }

    const out = clubs.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      currency: c.currency,
      primaryHex: c.primaryHex,
      createdAt: c.createdAt,
      counts: {
        activities: c._count.activities,
        customers: c._count.customers,
        bookings: bookingCounts[c.id] ?? 0,
      },
    }));

    return NextResponse.json({ clubs: out });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/* ---------------- POST: create a club (SUPERADMIN) ---------------- */
const Body = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/i),
  name: z.string().min(2),
  currency: z.string().min(1).max(8).default("EUR"),
  primaryHex: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional(),
  // Optional: initial tz (falls back to DEFAULT_TZ or "Europe/Athens")
  tz: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    const { slug, name, currency, primaryHex, tz } = parsed.data;

    // Normalize hex
    const hex = primaryHex ? (primaryHex.startsWith("#") ? primaryHex : `#${primaryHex}`) : null;

    // Create club + default settings in a txn
    const created = await prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: { slug: slug.toLowerCase(), name, currency: currency.toUpperCase(), primaryHex: hex },
        select: { id: true, slug: true, name: true, currency: true, primaryHex: true, createdAt: true },
      });

      // Default settings row (per-tenant)
      await tx.appSetting.create({
        data: {
          club: { connect: { id: club.id } },
          tz: tz || process.env.DEFAULT_TZ || "Europe/Athens",
          lang: "en",
          currency: club.currency,
          theme: "dark",
          accent: "pink",
        },
      });

      return club;
    });

    return NextResponse.json({ ok: true, club: created }, { status: 201 });
  } catch (e: any) {
    // Unique slug violation → 409
    if (String(e?.message || "").toLowerCase().includes("unique") || e?.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}