import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tenant = await requireTenant(); // header -> cookie

    const rows = await prisma.activity.findMany({
      where: { active: true, clubId: tenant.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        durationMin: true,
        maxParty: true,
        basePrice: true,
        coverImageUrl: true,
      },
    });

    const normalized = rows.map((r: any) => ({ ...r, imageUrl: r.coverImageUrl ?? null }));
    return NextResponse.json(normalized);
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg.startsWith("Tenant not found") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}