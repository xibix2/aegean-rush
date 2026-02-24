import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const t = await requireTenant();
    const jar = await cookies();
    const role = jar.get("admin_role")?.value || null;
    const email = jar.get("admin_email")?.value || null;

    return NextResponse.json({
      email,
      role,
      tenant: { id: t.id, slug: t.slug, name: t.name, currency: t.currency, primaryHex: t.primaryHex ?? null },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 400 });
  }
}