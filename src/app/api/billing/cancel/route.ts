// src/app/api/billing/cancel/route.ts
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
          "Subscription cancellation is no longer supported. Aegean Rush businesses use the platform for free and are charged only through booking commissions.",
      },
      { status: 410 },
    );
  } catch (err: any) {
    console.error("[billing/cancel] error", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "Unable to process request" },
      { status: 500 },
    );
  }
}