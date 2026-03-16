// src/app/[club]/admin/export/bookings/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireClubAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS = new Set(["paid", "pending", "cancelled", "refunded"]);

function fmtLocal(dt: Date, tz: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(dt);
}

function csvCell(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(
  req: Request,
  { params }: { params: { club: string } }
) {
  try {
    const slug = params.club;

    const tenant = await prisma.club.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    await requireClubAdmin(tenant.id);

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const statusRaw = url.searchParams.get("status");

    const setting = await prisma.appSetting.findUnique({
      where: { clubId: tenant.id },
      select: { tz: true },
    });

    const tz = setting?.tz || "Europe/Athens";

    const where: any = {
      timeSlot: { activity: { clubId: tenant.id } },
    };

    if (from || to) {
      where.createdAt = {};

      if (from) {
        const dFrom = new Date(`${from}T00:00:00.000Z`);
        if (!Number.isNaN(dFrom.getTime())) where.createdAt.gte = dFrom;
      }

      if (to) {
        const dTo = new Date(`${to}T23:59:59.999Z`);
        if (!Number.isNaN(dTo.getTime())) where.createdAt.lte = dTo;
      }
    }

    if (statusRaw) {
      const s = statusRaw.toLowerCase();
      if (STATUS.has(s)) where.status = s;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        timeSlot: { include: { activity: true } },
        payment: true,
      },
    });

    const header = [
      "booking_id",
      "status",
      "created_at_local",
      "customer_name",
      "customer_email",
      "experience",
      "start_at_local",
      "party_size",
      "total_cents",
      "total_eur",
      "payment_status",
    ] as const;

    const dataRows = bookings.map((b) => {
      const totalCents = b.totalPrice ?? 0;
      const totalEur = (totalCents / 100).toFixed(2);

      return [
        b.id,
        b.status,
        fmtLocal(b.createdAt, tz),
        b.customer?.name ?? "",
        b.customer?.email ?? "",
        b.timeSlot.activity.name,
        fmtLocal(b.timeSlot.startAt, tz),
        String(b.partySize ?? 0),
        String(totalCents),
        totalEur,
        b.payment?.status ?? "",
      ];
    });

    const rows = [header as unknown as string[], ...dataRows];
    const csv = "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings_${tenant.slug}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const code =
      msg === "Unauthorized" ? 401 :
      msg.includes("Forbidden") ? 403 : 400;

    return NextResponse.json({ error: msg }, { status: code });
  }
}