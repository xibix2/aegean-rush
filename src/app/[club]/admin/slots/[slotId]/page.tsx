// src/app/[club]/admin/slots/[slotId]/page.tsx
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { cookies } from "next/headers";
import SlotAdminClient from "@/components/admin/SlotAdminClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import { resend, FROM } from "@/lib/email";
import BookingConfirmed from "@/emails/BookingConfirmed";

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

/* =========================
   Server Actions
   ========================= */

export async function createAdminBooking(formData: FormData) {
  "use server";

  const tenant = await requireTenant();
  await requireClubAdmin(tenant.id);
  const base = `/${tenant.slug}`;

  const slotId = String(formData.get("slotId") || "");
  if (!slotId) throw new Error("Missing slotId");

  const email = String(formData.get("email") || "");
  const name = String(formData.get("name") || "Guest");
  const partySize = Number(formData.get("partySize") || 1);
  const markPaid = String(formData.get("markPaid") || "no") === "yes";

  const slot = await prisma.timeSlot.findFirst({
    where: { id: slotId, activity: { clubId: tenant.id } },
    include: {
      activity: true,
      bookings: { select: { status: true, partySize: true, createdAt: true } },
    },
  });

  if (!slot) throw new Error("Time slot not found");

  const now = new Date();
  const held = slot.bookings.reduce((sum, b) => {
    const freshPending =
      b.status === DB.PENDING &&
      (now.getTime() - new Date(b.createdAt).getTime()) / 60000 < 30;

    const isPaid = b.status === DB.CONFIRMED;
    return sum + (isPaid || freshPending ? b.partySize : 0);
  }, 0);

  const remaining = Math.max(0, slot.capacity - held);
  if (remaining < partySize) throw new Error("Not enough seats left");

  const customerEmail = email || `walkin+${Date.now()}@example.com`;

  const customer = await prisma.customer.upsert({
    where: { clubId_email: { clubId: tenant.id, email: customerEmail } },
    update: {},
    create: { clubId: tenant.id, email: customerEmail, name },
  });

  const unit = slot.priceCents ?? slot.activity.basePrice ?? 0;
  const total = unit * partySize;

  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      activityId: slot.activityId,
      timeSlotId: slot.id,
      partySize,
      totalPrice: total,
      status: markPaid ? DB.CONFIRMED : DB.PENDING,
    },
  });

  if (markPaid) {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: "stripe",
        providerIntentId: `admin_manual_${booking.id}`,
        amount: total,
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

      const startISO = slot.startAt.toISOString();
      const endISO = (
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
          partySize,
          totalCents: total,
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
      activity: true,
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
    activityName: slot.activity.name,
    capacity: slot.capacity,
    startAtISO: slot.startAt.toISOString(),
    endAtISO: (
      slot.endAt ??
      new Date(slot.startAt.getTime() + slot.activity.durationMin * 60000)
    ).toISOString(),
    bookings: slot.bookings.map((b) => ({
      id: b.id,
      customerName: b.customer?.name ?? null,
      customerEmail: b.customer?.email ?? null,
      partySize: b.partySize,
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