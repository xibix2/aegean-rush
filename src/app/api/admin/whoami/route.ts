import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const t = await requireTenant();
    const session = await requireClubAdmin(t.id);

    return NextResponse.json({
      email: session.email,
      role: session.role,
      tenant: { id: t.id, slug: t.slug, name: t.name, currency: t.currency, primaryHex: t.primaryHex ?? null },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 400 });
  }
}
