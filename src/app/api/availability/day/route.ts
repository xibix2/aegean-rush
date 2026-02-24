// src/app/api/availability/day/route.ts
import { NextRequest, NextResponse } from "next/server";

type AdminSlot = {
  id: string;
  startAt: string;
  endAt: string | null;
  capacity: number;
  priceCents: number;
  paid: number;
  pendingFresh: number;
  remaining: number;
};
type AdminGroup = {
  activityId: string;
  activityName: string;
  slots: AdminSlot[];
};
type AdminResponse = { date: string; activities: AdminGroup[] };

export async function GET(req: NextRequest) {
  const started = Date.now();
  const inUrl = new URL(req.url);
  const sp = inUrl.searchParams;

  const activityId = sp.get("activityId") || "";
  const date = sp.get("date") || "";
  const partySize = Math.max(1, Number(sp.get("partySize") || "1"));
  const tenant = req.headers.get("x-tenant-slug") || "";

  if (!activityId || !date) {
    return NextResponse.json(
      { error: "Missing activityId or date (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Call the admin endpoint in "public" mode
  const adminUrl = new URL("/api/admin/day", inUrl.origin);
  adminUrl.searchParams.set("public", "1");
  adminUrl.searchParams.set("date", date);
  adminUrl.searchParams.set("activityId", activityId);

  const headers = new Headers();
  if (tenant) headers.set("x-tenant-slug", tenant);
  headers.set("cache-control", "no-store");

  try {
    const r = await fetch(adminUrl, { headers, cache: "no-store" });
    const body = (await r.json().catch(() => ({}))) as Partial<AdminResponse>;

    if (!r.ok) {
      const status = r.status === 401 || r.status === 403 ? r.status : 502;
      return NextResponse.json(
        { error: (body as any)?.error || "Upstream error" },
        { status }
      );
    }

    // Flatten + filter by activity
    const groups = Array.isArray(body.activities) ? body.activities : [];
    const group = groups.find((g) => g.activityId === activityId);
    const rawSlots = group?.slots ?? [];

    // Map to client shape
    const slots = rawSlots.map((s) => {
      const remaining = Math.max(0, Number(s.remaining || 0));
      const canFit = remaining >= partySize;
      return {
        id: s.id,
        start: s.startAt,
        end: s.endAt,
        remaining,
        canFit,
        pricePerPerson: Number.isFinite(s.priceCents) ? s.priceCents : 0,
        totalPrice: (Number.isFinite(s.priceCents) ? s.priceCents : 0) * partySize,
      };
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[api/availability/day] IN", {
        path: "/api/availability/day",
        tenant,
        activityId,
        date,
        partySize,
      });
      console.log("[api/availability/day] OUT", {
        count: slots.length,
        ms: Date.now() - started,
      });
    }

    return NextResponse.json({ slots });
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/availability/day] upstream error", err);
    }
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}