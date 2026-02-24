import { NextRequest, NextResponse } from "next/server";

/**
 * Public availability endpoint that proxies to the admin/day endpoint
 * with ?public=1 so no admin auth is required.
 *
 * Usage:
 *   /api/availability/day?activityId=...&date=YYYY-MM-DD&partySize=1
 * Make sure your middleware injects x-tenant-slug.
 */
export async function GET(req: NextRequest) {
  try {
    const inUrl = new URL(req.url);
    const sp = inUrl.searchParams;

    const activityId = sp.get("activityId") || "";
    const date = sp.get("date") || "";        // YYYY-MM-DD
    const partySize = sp.get("partySize") || "1";

    if (!activityId || !date) {
      return NextResponse.json(
        { error: "Missing activityId or date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Build internal URL to the admin route with public=1
    const proxyUrl = new URL("/api/admin/day", inUrl.origin);
    proxyUrl.searchParams.set("public", "1");
    proxyUrl.searchParams.set("activityId", activityId);
    proxyUrl.searchParams.set("date", date);
    proxyUrl.searchParams.set("partySize", partySize);

    // Forward tenant header so the query is scoped to the correct club
    const headers = new Headers();
    const tenant = req.headers.get("x-tenant-slug") || "";
    if (tenant) headers.set("x-tenant-slug", tenant);
    headers.set("cache-control", "no-store");

    const upstream = await fetch(proxyUrl, { headers, cache: "no-store" });
    const body = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      // Bubble up auth errors, otherwise treat as upstream failure
      const status = upstream.status === 401 || upstream.status === 403 ? upstream.status : 502;
      return NextResponse.json(
        { error: body?.error || "Upstream error" },
        { status }
      );
    }

    // Body already in the { slots: [...] } shape expected by the customer UI
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy failed" },
      { status: 502 }
    );
  }
}