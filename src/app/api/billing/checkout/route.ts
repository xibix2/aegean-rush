// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);

    return NextResponse.json(
      {
        ok: false,
        error:
          "Subscription billing is no longer used. Aegean Rush businesses join for free and receive payouts through Stripe Connect, with a 20% platform commission per completed booking.",
      },
      { status: 410 },
    );
  } catch (err) {
    console.error("[billing/checkout] error", err);
    return NextResponse.json(
      { ok: false, error: "Unable to process request" },
      { status: 500 },
    );
  }
}