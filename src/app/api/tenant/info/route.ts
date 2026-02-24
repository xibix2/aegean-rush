import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tenant = await requireTenant(); // header -> cookie
    // Re-fetch to ensure fields are up-to-date (or you could just return `tenant`)
    const club = await prisma.club.findUnique({
      where: { id: tenant.id },
      select: {
        id: true,
        slug: true,
        name: true,
        currency: true,
        primaryHex: true,
      },
    });
    if (!club) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    return NextResponse.json({
      id: club.id,
      slug: club.slug,
      name: club.name,
      currency: club.currency,
      theme: { primaryHex: club.primaryHex ?? "#0ea5e9" }, // safe default
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 400 });
  }
}