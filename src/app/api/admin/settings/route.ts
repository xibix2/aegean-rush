// src/app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SettingsBody = z.object({
  // Club-level fields
  name: z.string().min(1).max(200).optional(),
  currency: z
    .string()
    .min(3)
    .max(3)
    .transform((v) => v.toUpperCase())
    .optional(), // e.g. EUR
  primaryHex: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional(),

  // AppSetting-level fields
  tz: z.string().optional(),
  lang: z.string().optional(),
  theme: z.string().optional(),
  accent: z.string().optional(),
});

export async function GET() {
  try {
    const t = await requireTenant();
    await requireClubAdmin(t.id); // 🔒 also protect reads

    const [club, setting] = await Promise.all([
      prisma.club.findUnique({
        where: { id: t.id },
        select: {
          id: true,
          slug: true,
          name: true,
          currency: true,
          primaryHex: true,
        },
      }),
      prisma.appSetting.findUnique({
        where: { clubId: t.id },
        select: { tz: true, lang: true, theme: true, accent: true, updatedAt: true },
      }),
    ]);

    return NextResponse.json({ club, setting });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.includes("Forbidden")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const t = await requireTenant();
    await requireClubAdmin(t.id); // 🔒 only this club’s admin or superadmin

    const json = await req.json().catch(() => ({}));
    const parsed = SettingsBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    const data = parsed.data;

    // Split updates across Club and AppSetting
    const clubData: Record<string, unknown> = {};
    if (data.name !== undefined) clubData.name = data.name;
    if (data.currency !== undefined) clubData.currency = data.currency;
    if (data.primaryHex !== undefined) {
      clubData.primaryHex = data.primaryHex.startsWith("#")
        ? data.primaryHex
        : `#${data.primaryHex}`;
    }

    const appData: Record<string, unknown> = {};
    if (data.tz !== undefined) appData.tz = data.tz;
    if (data.lang !== undefined) appData.lang = data.lang;
    if (data.theme !== undefined) appData.theme = data.theme;
    if (data.accent !== undefined) appData.accent = data.accent;

    const ops: Promise<any>[] = [];
    if (Object.keys(clubData).length) {
      ops.push(prisma.club.update({ where: { id: t.id }, data: clubData }));
    }
    if (Object.keys(appData).length) {
      ops.push(
        prisma.appSetting.upsert({
          where: { clubId: t.id },
          create: { clubId: t.id, tz: "Europe/Athens", ...appData }, // sensible default
          update: appData,
        })
      );
    }

    if (!ops.length) {
      return NextResponse.json({ ok: true, note: "No changes" });
    }

    await Promise.all(ops);

    // Return fresh values
    const [club, setting] = await Promise.all([
      prisma.club.findUnique({
        where: { id: t.id },
        select: {
          id: true,
          slug: true,
          name: true,
          currency: true,
          primaryHex: true,
        },
      }),
      prisma.appSetting.findUnique({
        where: { clubId: t.id },
        select: { tz: true, lang: true, theme: true, accent: true, updatedAt: true },
      }),
    ]);

    return NextResponse.json({ ok: true, club, setting });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.includes("Forbidden")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}