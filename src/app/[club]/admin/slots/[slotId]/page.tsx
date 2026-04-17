import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { cookies } from "next/headers";
import SlotAdminClient from "@/components/admin/SlotAdminClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import { resend, FROM } from "@/lib/email";
import BookingConfirmed from "@/emails/BookingConfirmed";
import { getBookingQuoteAndAvailability } from "@/lib/booking-engine";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/* =========================
   DB Status Constants
   ========================= */
const DB = {
  PENDING: "pending",
  CONFIRMED: "paid",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

/* =========================
   Action State
   ========================= */
export type AdminBookingActionState = {
  ok: boolean;
  error: string | null;
  success: string | null;
};

const initialAdminBookingState: AdminBookingActionState = {
  ok: false,
  error: null,
  success: null,
};

/* =========================
   Stripe Helper
   ========================= */
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

/* =========================
   Helper types for actions
   ========================= */
type CancelPayload = FormData | { bookingId: string; slotId?: string | null };
type RefundPayload = FormData | { bookingId: string; slotId?: string | null };

function parseOptionalInt(value: FormDataEntryValue | null) {
  if (value == null) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function parseDateTimeLocalWithOffset(
  value: string | undefined,
  timezoneOffsetMinutes: number
) {
  if (!value) return null;

  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );
  if (!m) return null;

  const [, y, mo, d, h, mi] = m.map(Number);
  const utcMs =
    Date.UTC(y, mo - 1, d, h, mi) + timezoneOffsetMinutes * 60 * 1000;

  const dt = new Date(utcMs);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/* =========================
   Server Actions
   ========================= */

export async function createAdminBooking(
  _prevState: AdminBookingActionState,
  formData: FormData
): Promise<AdminBookingActionState> {
  "use server";

  try {
    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);
    const base = `/${tenant.slug}`;

    const slotId = String(formData.get("slotId") || "");
    if (!slotId) {
      return { ok: false, error: "Missing slot ID.", success: null };
    }

    const email = String(formData.get("email") || "").trim();
    const name = String(formData.get("name") || "Guest").trim() || "Guest";
    const phone = String(formData.get("phone") || "").trim();
    const markPaid = String(formData.get("markPaid") || "no") === "yes";

    const partySize = parseOptionalInt(formData.get("partySize"));
    const startTimeRaw = parseOptionalString(formData.get("startTime"));
    const durationOptionId = parseOptionalString(formData.get("durationOptionId"));
    const units = parseOptionalInt(formData.get("units"));
    const guests = parseOptionalInt(formData.get("guests"));
    const timezoneOffsetMinutes =
      parseOptionalInt(formData.get("timezoneOffsetMinutes")) ?? 0;

    const slot = await prisma.timeSlot.findFirst({
      where: { id: slotId, activity: { clubId: tenant.id } },
      include: {
        activity: {
          include: {
            durationOptions: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            partySize: true,
            reservedUnits: true,
            bookingStartAt: true,
            bookingEndAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!slot) {
      return { ok: false, error: "Time slot not found.", success: null };
    }

    if (slot.status !== "open") {
      return {
        ok: false,
        error: "This slot is closed and cannot accept bookings.",
        success: null,
      };
    }

    let parsedStartTime: Date | undefined = undefined;

    if (slot.activity.mode !== "FIXED_SEAT_EVENT") {
      if (!startTimeRaw) {
        return {
          ok: false,
          error: "Please choose a valid start time.",
          success: null,
        };
      }

      parsedStartTime = parseDateTimeLocalWithOffset(
        startTimeRaw,
        timezoneOffsetMinutes
      ) ?? undefined;

      if (!parsedStartTime) {
        return {
          ok: false,
          error: "Invalid start time format.",
          success: null,
        };
      }
    }

    const quote = getBookingQuoteAndAvailability({
      activity: {
        id: slot.activity.id,
        name: slot.activity.name,
        mode: slot.activity.mode,
        minParty: slot.activity.minParty,
        maxParty: slot.activity.maxParty,
        basePrice: slot.activity.basePrice,
        guestsPerUnit: slot.activity.guestsPerUnit,
        maxUnitsPerBooking: slot.activity.maxUnitsPerBooking,
        slotIntervalMin: slot.activity.slotIntervalMin,
        durationOptions: slot.activity.durationOptions.map((d) => ({
          id: d.id,
          label: d.label,
          durationMin: d.durationMin,
          priceCents: d.priceCents,
          isActive: d.isActive,
          sortOrder: d.sortOrder,
        })),
      },
      slot: {
        id: slot.id,
        activityId: slot.activityId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        capacity: slot.capacity,
        priceCents: slot.priceCents,
      },
      existingBookings: slot.bookings,
      partySize,
      startTime: parsedStartTime,
      durationOptionId,
      units,
      guests,
    });

    if (!quote.isValid) {
      return {
        ok: false,
        error: quote.errors[0] || "Invalid booking request.",
        success: null,
      };
    }

    const customerEmail = email || `walkin+${Date.now()}@example.com`;

    const customer = await prisma.customer.upsert({
      where: { clubId_email: { clubId: tenant.id, email: customerEmail } },
      update: {
        name,
        phone: phone || null,
      },
      create: {
        clubId: tenant.id,
        email: customerEmail,
        name,
        phone: phone || null,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        activityId: slot.activityId,
        timeSlotId: slot.id,
        partySize: quote.partySize,
        totalPrice: quote.totalPrice,
        status: markPaid ? DB.CONFIRMED : DB.PENDING,

        contactName: name,
        contactEmail: email || null,
        contactPhone: phone || null,

        reservedUnits: quote.reservedUnits,
        bookingStartAt: quote.bookingStartAt,
        bookingEndAt: quote.bookingEndAt,
        durationMinSnapshot: quote.durationMin,
        unitPriceSnapshot: quote.unitPrice,
        pricingLabelSnapshot: quote.pricingLabel,
      },
    });

    if (markPaid) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: "stripe",
          providerIntentId: `admin_manual_${booking.id}`,
          amount: quote.totalPrice,
          currency: (tenant.currency || "EUR").toUpperCase(),
          status: "succeeded",
        },
      });
    }

    if (markPaid && email) {
      try {
        const club = await prisma.club.findUnique({
          where: { id: tenant.id },
          select: { logoKey: true },
        });

        const startISO = (booking.bookingStartAt ?? slot.startAt).toISOString();

        const endISO = (
          booking.bookingEndAt ??
          slot.endAt ??
          new Date(slot.startAt.getTime() + slot.activity.durationMin * 60000)
        ).toISOString();

        await resend.emails.send({
          from: FROM,
          to: email,
          subject: `Your booking with ${tenant.name} is confirmed`,
          react: BookingConfirmed({
            activity: slot.activity.name,
            startISO,
            endISO,
            partySize: booking.partySize,
            totalCents: booking.totalPrice,
            clubName: tenant.name,
            logoUrl: club?.logoKey ?? undefined,
            brandPrimary: tenant.primaryHex ?? undefined,
          }),
        });
      } catch (err: any) {
        console.error(
          "Failed to send admin-created booking email:",
          err?.message || err
        );
      }
    }

    revalidatePath(`${base}/admin/slots/${slotId}`);
    revalidatePath(`${base}/admin/bookings`);

    return {
      ok: true,
      error: null,
      success: markPaid
        ? "Booking created and marked as paid."
        : "Booking created successfully.",
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Something went wrong while creating the booking.",
      success: null,
    };
  }
}

export async function cancelBookingAction(input: CancelPayload) {
  "use server";

  const tenant = await requireTenant();
  await requireClubAdmin(tenant.id);
  const base = `/${tenant.slug}`;

  let bookingId = "";
  let slotId = "";

  if (input instanceof FormData) {
    bookingId = String(input.get("bookingId") || "");
    slotId = String(input.get("slotId") || "");
  } else {
    bookingId = String(input.bookingId || "");
    slotId = String(input.slotId || "");
  }

  if (!bookingId) throw new Error("Missing bookingId");

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, timeSlot: { activity: { clubId: tenant.id } } },
    select: { id: true, status: true },
  });

  if (!booking) throw new Error("Booking not found");

  if (booking.status !== DB.REFUNDED) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: DB.CANCELLED },
    });
  }

  if (slotId) revalidatePath(`${base}/admin/slots/${slotId}`);
  revalidatePath(`${base}/admin/bookings`);
}

export async function refundBookingAction(input: RefundPayload) {
  "use server";

  const tenant = await requireTenant();
  await requireClubAdmin(tenant.id);
  const base = `/${tenant.slug}`;

  let bookingId = "";
  let slotId = "";

  if (input instanceof FormData) {
    bookingId = String(input.get("bookingId") || "");
    slotId = String(input.get("slotId") || "");
  } else {
    bookingId = String(input.bookingId || "");
    slotId = String(input.slotId || "");
  }

  if (!bookingId) throw new Error("Missing bookingId");

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, timeSlot: { activity: { clubId: tenant.id } } },
    include: { payment: true },
  });

  if (!booking) throw new Error("Booking not found");

  if (booking.status !== DB.CONFIRMED) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: DB.CANCELLED },
    });

    if (slotId) revalidatePath(`${base}/admin/slots/${slotId}`);
    revalidatePath(`${base}/admin/bookings`);
    return;
  }

  const payment =
    booking.payment ||
    (await prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    }));

  const rawPI = payment?.providerIntentId ?? null;
  const hasStripePI = !!rawPI && rawPI.startsWith("pi_");

  if (!hasStripePI) {
    if (payment?.id) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "refunded" },
      });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: DB.REFUNDED },
    });

    if (slotId) revalidatePath(`${base}/admin/slots/${slotId}`);
    revalidatePath(`${base}/admin/bookings`);
    return;
  }

  const stripe = getStripe();
  await stripe.refunds.create({ payment_intent: rawPI });

  if (payment?.id) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "refunded" },
    });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: DB.REFUNDED },
  });

  if (slotId) revalidatePath(`${base}/admin/slots/${slotId}`);
  revalidatePath(`${base}/admin/bookings`);
}

/* =========================
   Page (Server Component)
   ========================= */

export default async function SlotAdminPage({
  params,
}: {
  params:
    | { club?: string; slotId?: string; id?: string }
    | Promise<{ club?: string; slotId?: string; id?: string }>;
}) {
  const tenant = await requireTenant();
  await requireClubAdmin(tenant.id);

  const p = await Promise.resolve(params);
  const slotId = (p?.slotId || p?.id || "").trim();

  if (!slotId) {
    console.error("SlotAdminPage: Missing or invalid slot ID param", p);
    throw new Error("Missing slotId route parameter");
  }

  const jar = await cookies();
  const currency =
    (tenant.currency || "").toUpperCase() === "EUR"
      ? jar.get("ui_currency")?.value ?? "€"
      : jar.get("ui_currency")?.value ?? tenant.currency ?? "€";

  const slot = await prisma.timeSlot.findFirst({
    where: { id: slotId, activity: { clubId: tenant.id } },
    include: {
      activity: {
        include: {
          durationOptions: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        include: { customer: true, payment: true },
      },
    },
  });

  if (!slot) {
    return (
      <SlotAdminClient
        currency={currency}
        slot={null}
        createAdminBooking={createAdminBooking}
        cancelBookingAction={cancelBookingAction}
        refundBookingAction={refundBookingAction}
      />
    );
  }

  const slotPayload = {
    id: slot.id,
    status: slot.status,
    isClosed: slot.status === "closed",
    activityName: slot.activity.name,
    activityMode: slot.activity.mode,
    capacity: slot.capacity,
    minParty: slot.activity.minParty,
    maxParty: slot.activity.maxParty,
    guestsPerUnit: slot.activity.guestsPerUnit,
    maxUnitsPerBooking: slot.activity.maxUnitsPerBooking,
    slotIntervalMin: slot.activity.slotIntervalMin,
    durationOptions: slot.activity.durationOptions.map((d) => ({
      id: d.id,
      label: d.label,
      durationMin: d.durationMin,
      priceCents: d.priceCents,
    })),
    startAtISO: slot.startAt.toISOString(),
    endAtISO: (
      slot.endAt ??
      new Date(slot.startAt.getTime() + slot.activity.durationMin * 60000)
    ).toISOString(),
    bookings: slot.bookings.map((b) => ({
      id: b.id,
      customerName: b.contactName ?? b.customer?.name ?? null,
      customerEmail: b.contactEmail ?? b.customer?.email ?? null,
      partySize: b.partySize,
      reservedUnits: b.reservedUnits,
      bookingStartAtISO: (b.bookingStartAt ?? slot.startAt).toISOString(),
      bookingEndAtISO: (
        b.bookingEndAt ??
        slot.endAt ??
        new Date(slot.startAt.getTime() + slot.activity.durationMin * 60000)
      ).toISOString(),
      durationMinSnapshot: b.durationMinSnapshot,
      pricingLabelSnapshot: b.pricingLabelSnapshot,
      status: b.status,
      totalPrice: b.totalPrice,
      createdAtISO: b.createdAt.toISOString(),
      payment: {
        providerIntentId: b.payment?.providerIntentId ?? null,
        providerRef: null,
        stripePaymentIntentId: null,
        paymentIntentId: null,
      },
    })),
  };

  return (
    <SlotAdminClient
      currency={currency}
      slot={slotPayload}
      createAdminBooking={createAdminBooking}
      cancelBookingAction={cancelBookingAction}
      refundBookingAction={refundBookingAction}
    />
  );
}