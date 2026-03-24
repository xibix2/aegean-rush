import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getActiveTz, localStartOfDayUTC, resolveTz } from "@/lib/timezone";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const revalidate = 0;

const Query = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);

    const { date, tz: tzParam } = parsed.data;

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

    const startUtc = localStartOfDayUTC(date, tz);

    const [Y, M, D] = date.split("-").map(Number);
    const nextLocal = new Date(Date.UTC(Y, M - 1, D));
    nextLocal.setUTCDate(nextLocal.getUTCDate() + 1);
    const nextIso = `${nextLocal.getUTCFullYear()}-${String(
      nextLocal.getUTCMonth() + 1,
    ).padStart(2, "0")}-${String(nextLocal.getUTCDate()).padStart(2, "0")}`;
    const endUtc = localStartOfDayUTC(nextIso, tz);

    const slots = await prisma.timeSlot.findMany({
      where: {
        startAt: { gte: startUtc, lt: endUtc },
        activity: { clubId: tenant.id },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        activity: {
          select: {
            id: true,
            name: true,
            mode: true,
            guestsPerUnit: true,
          },
        },
        bookings: {
          select: {
            id: true,
            createdAt: true,
            status: true,
            partySize: true,
            totalPrice: true,
            customerId: true,

            contactName: true,
            contactEmail: true,
            contactPhone: true,

            reservedUnits: true,
            bookingStartAt: true,
            bookingEndAt: true,
            durationMinSnapshot: true,
            pricingLabelSnapshot: true,
            unitPriceSnapshot: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startAt: "asc" },
    });

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

    const rows = slots.flatMap((s) =>
      s.bookings.map((b) => {
        const c = b.customerId ? customerMap.get(b.customerId) : undefined;

        return {
          id: b.id,
          ref: b.id.slice(0, 10),
          status: b.status,
          mode: s.activity?.mode ?? "FIXED_SEAT_EVENT",

          partySize: b.partySize ?? 1,
          reservedUnits: b.reservedUnits ?? null,

          totalPrice: b.totalPrice ?? 0,
          unitPriceSnapshot: b.unitPriceSnapshot ?? null,

          customerName: b.contactName ?? c?.name ?? "",
          customerEmail: b.contactEmail ?? c?.email ?? "",
          customerPhone: b.contactPhone ?? "",

          activityId: s.activity?.id ?? "",
          activityName: s.activity?.name ?? "",

          slotStartAt: s.startAt,
          slotEndAt: s.endAt,

          bookingStartAt: b.bookingStartAt ?? null,
          bookingEndAt: b.bookingEndAt ?? null,

          durationMinSnapshot: b.durationMinSnapshot ?? null,
          pricingLabelSnapshot: b.pricingLabelSnapshot ?? null,

          guestsPerUnit: s.activity?.guestsPerUnit ?? null,

          createdAt: b.createdAt,
        };
      }),
    );

    rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

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