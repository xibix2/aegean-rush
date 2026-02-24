import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getActiveTz, localStartOfDayUTC, resolveTz } from "@/lib/timezone";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const revalidate = 0;

const Query = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD (local)
  tz: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = Query.safeParse({
      date: url.searchParams.get("date") || "",
      tz: url.searchParams.get("tz") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "date=YYYY-MM-DD is required" },
        { status: 400 },
      );
    }

    const tenant = await requireTenant(); // header -> cookie
    await requireClubAdmin(tenant.id); // 🔒 admin-only

    const { date, tz: tzParam } = parsed.data;

    // ---------- NEW: resolve timezone from CLUB settings first ----------
    const club = await prisma.club.findUnique({
      where: { id: tenant.id },
      select: {
        setting: {
          select: { tz: true },
        },
      },
    });

    let tz: string;
    if (tzParam) {
      tz = resolveTz(tzParam);
    } else if (club?.setting?.tz) {
      tz = resolveTz(club.setting.tz);
    } else {
      tz = await getActiveTz();
    }

    // Compute local-day boundaries → UTC (DST-safe)
    const startUtc = localStartOfDayUTC(date, tz);

    const [Y, M, D] = date.split("-").map(Number);
    const nextLocal = new Date(Date.UTC(Y, M - 1, D));
    nextLocal.setUTCDate(nextLocal.getUTCDate() + 1);
    const nextIso = `${nextLocal.getUTCFullYear()}-${String(
      nextLocal.getUTCMonth() + 1,
    ).padStart(2, "0")}-${String(nextLocal.getUTCDate()).padStart(2, "0")}`;
    const endUtc = localStartOfDayUTC(nextIso, tz);

    // 1) Pull all slots for the day (SCOPED BY TENANT via Activity)
    const slots = await prisma.timeSlot.findMany({
      where: {
        startAt: { gte: startUtc, lt: endUtc },
        activity: { clubId: tenant.id },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        activity: { select: { name: true } },
        bookings: {
          select: {
            id: true,
            createdAt: true,
            status: true,
            partySize: true,
            totalPrice: true,
            customerId: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startAt: "asc" },
    });

    // 2) Gather customer ids and fetch customers (same tenant)
    const customerIds = Array.from(
      new Set(
        slots
          .flatMap((s) => s.bookings.map((b) => b.customerId))
          .filter(Boolean),
      ),
    ) as string[];

    const customers = customerIds.length
      ? await prisma.customer.findMany({
          where: { id: { in: customerIds }, clubId: tenant.id },
          select: { id: true, name: true, email: true },
        })
      : [];

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    // 3) Flatten into rows
    const rows = slots.flatMap((s) =>
      s.bookings.map((b) => {
        const c = b.customerId ? customerMap.get(b.customerId) : undefined;
        return {
          id: b.id,
          ref: b.id.slice(0, 10),
          status: b.status,
          partySize: b.partySize,
          totalPrice: b.totalPrice, // cents
          customerName: c?.name ?? "",
          customerEmail: c?.email ?? "",
          startAt: s.startAt,
          endAt: s.endAt,
          activityName: s.activity?.name ?? "",
          createdAt: b.createdAt,
        };
      }),
    );

    // newest first
    rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    // Optional debug log in your server logs if you want:
    // console.log("[/api/bookings]", { tenant: tenant.id, date, tz, slots: slots.length, rows: rows.length });

    return NextResponse.json({ tz, bookings: rows });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    if (msg === "Unauthorized")
      return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.includes("Forbidden"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const status = msg.startsWith("Tenant not found") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}