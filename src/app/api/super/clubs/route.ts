// src/app/api/super/clubs/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await requireSuperAdmin(); // 🔒
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, createdAt: true },
  });
  return NextResponse.json({ clubs });
}