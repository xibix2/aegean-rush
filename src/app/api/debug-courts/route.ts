import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await requireTenant();
  const courts = await prisma.activity.findMany({
    where: { active: true, clubId: tenant.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      basePrice: true,
      locationId: true,
      coverImageUrl: true,
    },
  });
  return NextResponse.json({ tenant: { id: tenant.id, slug: tenant.slug }, courts });
}