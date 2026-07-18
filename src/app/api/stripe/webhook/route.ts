import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { resend, FROM } from "@/lib/email";
import BookingConfirmed from "@/emails/BookingConfirmed";
import { createEvent } from "ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getEnvOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function buildAbsoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return null;

  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

async function getBookingWithTenant(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
      status: true,
      bookingStartAt: true,
      bookingEndAt: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      timeSlot: {
        select: {
          startAt: true,
          endAt: true,
          activity: {
            select: {
              name: true,
              clubId: true,
              club: {
                select: {
                  id: true,
                  name: true,
                  currency: true,
                  logoKey: true,
                  primaryHex: true,
                  emailFromName: true,
                  emailFromEmail: true,
                  setting: {
                    select: {
                      tz: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

async function attachRealCustomerToBooking(
  bookingId: string,
  email: string | null | undefined,
  name: string | null | undefined,
  phone?: string | null,
) {
  if (!email) return;

  const booking = await getBookingWithTenant(bookingId);
  if (!booking) return;

  const clubId = booking.timeSlot?.activity.clubId;
  if (!clubId) return;

  const real = await prisma.customer.upsert({
    where: { clubId_email: { clubId, email } },
    create: {
      clubId,
      email,
      name: name || "Customer",
      phone: phone ?? null,
    },
    update: {
      name: name || undefined,
      phone: phone ?? undefined,
    },
  });

  if (booking.customerId === real.id) {
    const bookingUpdate: {
      contactEmail?: string;
      contactName?: string;
      contactPhone?: string;
    } = {};

    if (email && booking.contactEmail !== email) {
      bookingUpdate.contactEmail = email;
    }

    if (name && booking.contactName !== name) {
      bookingUpdate.contactName = name;
    }

    if (phone && booking.contactPhone !== phone) {
      bookingUpdate.contactPhone = phone;
    }

    if (Object.keys(bookingUpdate).length > 0) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: bookingUpdate,
      });
    }

    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      customerId: real.id,
      contactEmail: email ?? undefined,
      contactName: name ?? undefined,
      contactPhone: phone ?? undefined,
    },
  });
}

function getArrivalInstruction(activityName: string) {
  const normalized = activityName.toLowerCase();
  const isBoatRental =
    normalized.includes("boat rental") ||
    (normalized.includes("rent") && normalized.includes("boat"));

  if (isBoatRental) {
    return "Please arrive 30 minutes before your boat rental start time for check-in, safety briefing, and preparation.";
  }

  return "Please arrive 10-15 minutes before your activity start time for check-in and preparation.";
}

function formatLocalDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function icsDate(date: Date): [number, number, number, number, number] {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

function buildInternalBookingText(input: {
  clubName: string;
  activityName: string;
  bookingStart: Date;
  bookingEnd: Date;
  timeZone: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  partySize: number;
  reservedUnits: number;
  durationMin: number | null;
  pricingLabel: string | null;
  totalCents: number;
  bookingToken: string;
  arrivalText: string;
  tickets: Array<{ label: string; quantity: number; priceCents: number }>;
}) {
  const lines = [
    "New online booking paid",
    "",
    `Club: ${input.clubName}`,
    `Activity: ${input.activityName}`,
    `Start: ${formatLocalDateTime(input.bookingStart, input.timeZone)} (${input.timeZone})`,
    `End: ${formatLocalDateTime(input.bookingEnd, input.timeZone)} (${input.timeZone})`,
    `Arrival note: ${input.arrivalText}`,
    "",
    `Customer name: ${input.customerName || "Not provided"}`,
    `Customer email: ${input.customerEmail || "Not provided"}`,
    `Customer phone: ${input.customerPhone || "Not provided"}`,
    "",
    `Guests: ${input.partySize}`,
    `Reserved units: ${input.reservedUnits}`,
    `Duration: ${input.pricingLabel || (input.durationMin ? `${input.durationMin} min` : "Default")}`,
    `Total paid: EUR ${(input.totalCents / 100).toFixed(2)}`,
    `Booking token: ${input.bookingToken}`,
  ];

  if (input.tickets.length > 0) {
    lines.push("", "Tickets:");
    for (const ticket of input.tickets) {
      lines.push(
        `- ${ticket.quantity} x ${ticket.label} @ EUR ${(ticket.priceCents / 100).toFixed(2)}`,
      );
    }
  }

  return lines.join("\n");
}

async function sendInternalBookingNotification(input: {
  from: string;
  replyTo?: string;
  recipients: string[];
  clubName: string;
  activityName: string;
  bookingStart: Date;
  bookingEnd: Date;
  timeZone: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  partySize: number;
  reservedUnits: number;
  durationMin: number | null;
  pricingLabel: string | null;
  totalCents: number;
  bookingToken: string;
  arrivalText: string;
  tickets: Array<{ label: string; quantity: number; priceCents: number }>;
}) {
  const recipients = Array.from(new Set(input.recipients.filter(Boolean)));
  if (recipients.length === 0) return;

  await resend.emails.send({
    from: input.from,
    to: recipients,
    subject: `New booking paid: ${input.activityName}`,
    text: buildInternalBookingText(input),
    ...(input.replyTo ? { reply_to: input.replyTo } : {}),
  });
}

async function sendBookingEmails(bookingId: string, fallbackEmail?: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      timeSlot: {
        include: {
          activity: {
            include: {
              club: {
                include: {
                  setting: true,
                },
              },
            },
          },
        },
      },
      customer: true,
      tickets: true,
    },
  });

  if (!b) return;

  const internalNotificationEmails = [
    "aegeanrush@gmail.com",
    "paradisewatersports@gmail.com",
  ];

  const to = fallbackEmail ?? b.contactEmail ?? b.customer?.email ?? null;

  if (fallbackEmail && b.customer?.email?.startsWith("guest+")) {
    try {
      await prisma.customer.update({
        where: { id: b.customerId },
        data: { email: fallbackEmail },
      });
    } catch {}
  }

  const bookingStart = b.bookingStartAt ?? b.timeSlot.startAt;
  const bookingEnd =
    b.bookingEndAt ??
    b.timeSlot.endAt ??
    new Date(bookingStart.getTime() + 90 * 60 * 1000);

  const club = b.timeSlot.activity.club;
  const clubName = club?.name ?? "Your business";
  const senderDisplayName =
    (club?.emailFromName && club.emailFromName.trim().length > 0
      ? club.emailFromName.trim()
      : clubName) || "Your business";

  function parseFromAddress(fromAddress: string): { email: string } {
    const match = fromAddress.match(/<(.*)>/);
    if (match) return { email: match[1].trim() };
    return { email: fromAddress.trim() };
  }

  const defaultFromEmail = parseFromAddress(FROM).email;
  const from = `${senderDisplayName} <${defaultFromEmail}>`;
  const replyTo =
    club?.emailFromEmail && club.emailFromEmail.includes("@")
      ? club.emailFromEmail.trim()
      : undefined;

  const clubTz =
    club?.setting?.tz?.trim() || process.env.TZ?.trim() || "Europe/Athens";
  const activityName = b.timeSlot.activity.name;
  const logoUrl = buildAbsoluteUrl(club?.logoKey ?? null);
  const brandPrimary = club?.primaryHex ?? null;
  const customerName = b.contactName || b.customer?.name || null;
  const customerEmail = fallbackEmail ?? b.contactEmail ?? b.customer?.email ?? null;
  const customerPhone = b.contactPhone || b.customer?.phone || null;
  const arrivalText = getArrivalInstruction(activityName);
  const ticketLines = b.tickets.map((ticket) => ({
    label: ticket.labelSnapshot,
    quantity: ticket.quantity,
    priceCents: ticket.priceCentsSnapshot,
  }));

  const { error, value } = createEvent({
    title: activityName,
    start: icsDate(bookingStart),
    startInputType: "utc",
    startOutputType: "utc",
    end: icsDate(bookingEnd),
    endInputType: "utc",
    endOutputType: "utc",
    description: `Meeting point: ${clubName}`,
    status: "CONFIRMED",
  });
  const icsBase64 = error ? undefined : Buffer.from(value!).toString("base64");

  if (to) {
    try {
      await resend.emails.send({
        from,
        to,
        subject: `Your booking with ${senderDisplayName} is confirmed`,
        react: BookingConfirmed({
          activity: activityName,
          startISO: bookingStart.toISOString(),
          endISO: bookingEnd.toISOString(),
          partySize: b.partySize,
          totalCents: b.totalPrice!,
          clubName: senderDisplayName,
          logoUrl,
          brandPrimary,
          bookingToken: b.publicToken,
          customerName,
          arrivalText,
          tickets: ticketLines,
        }),
        ...(replyTo ? { reply_to: replyTo } : {}),
        attachments: icsBase64
          ? [{ filename: "booking.ics", content: icsBase64 }]
          : undefined,
      });
    } catch (e) {
      console.error(
        "Failed to send customer booking email:",
        (e as any)?.message || e,
      );
    }
  }

  try {
    await sendInternalBookingNotification({
      from,
      replyTo: customerEmail || replyTo,
      recipients: internalNotificationEmails,
      clubName: senderDisplayName,
      activityName,
      bookingStart,
      bookingEnd,
      timeZone: clubTz,
      customerName,
      customerEmail,
      customerPhone,
      partySize: b.partySize,
      reservedUnits: b.reservedUnits,
      durationMin: b.durationMinSnapshot,
      pricingLabel: b.pricingLabelSnapshot,
      totalCents: b.totalPrice!,
      bookingToken: b.publicToken,
      arrivalText,
      tickets: ticketLines,
    });
  } catch (e) {
    console.error(
      "Failed to send internal booking email:",
      (e as any)?.message || e,
    );
  }
}

async function markBookingPaid(
  bookingId: string,
  providerIntentId?: string | null,
  amount?: number | null,
) {
  const b = await getBookingWithTenant(bookingId);
  if (!b) return { alreadyPaid: false, found: false };

  const alreadyPaid = b.status === "paid";
  const clubCurrency =
    b.timeSlot?.activity.club?.currency?.toUpperCase?.() || "EUR";

  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      provider: "stripe",
      providerIntentId: providerIntentId ?? `pi_${bookingId}_unknown`,
      amount: amount ?? 0,
      currency: clubCurrency,
      status: "succeeded",
    },
    update: {
      status: "succeeded",
      ...(providerIntentId ? { providerIntentId } : {}),
      ...(typeof amount === "number" ? { amount } : {}),
      currency: clubCurrency,
    },
  });

  if (!alreadyPaid) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "paid" },
    });
  }

  return { alreadyPaid, found: true };
}

async function markBookingCancelledIfPending(bookingId: string) {
  await prisma.booking.updateMany({
    where: { id: bookingId, status: "pending" as any },
    data: { status: "cancelled" as any },
  });
}

function extractBookingIdFromSession(session: Stripe.Checkout.Session) {
  return (
    (session.metadata?.bookingId as string | undefined) ||
    (session.client_reference_id as string | undefined) ||
    null
  );
}

function extractPaymentIntentIdFromSession(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
}

async function getPayerDetails(
  session: Stripe.Checkout.Session,
  paymentIntentId: string | null,
) {
  const payerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  const payerPhone = session.customer_details?.phone ?? null;

  let payerName: string | null = null;

  if (paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const charge = (pi.latest_charge as Stripe.Charge) || null;
      payerName = charge?.billing_details?.name || null;
    } catch (e: any) {
      console.error("PI retrieve failed:", e?.message || e);
    }
  }

  return { payerEmail, payerName, payerPhone };
}

async function handleSuccessfulCheckoutSession(
  session: Stripe.Checkout.Session,
  eventLabel: string,
) {
  const bookingId = extractBookingIdFromSession(session);
  if (!bookingId) return;

  const paymentIntentId = extractPaymentIntentIdFromSession(session);
  const amount = session.amount_total ?? null;
  const { payerEmail, payerName, payerPhone } = await getPayerDetails(
    session,
    paymentIntentId,
  );

  console.log(`✅ ${eventLabel} (booking)`, {
    bookingId,
    sessionId: session.id,
    payerEmail,
    payerName,
  });

  const result = await markBookingPaid(bookingId, paymentIntentId, amount);
  await attachRealCustomerToBooking(
    bookingId,
    payerEmail,
    payerName,
    payerPhone,
  );

  if (payerEmail || payerName || payerPhone) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        contactEmail: payerEmail ?? undefined,
        contactName: payerName ?? undefined,
        contactPhone: payerPhone ?? undefined,
      },
    });
  }

  if (!result.alreadyPaid) {
    await sendBookingEmails(bookingId, payerEmail || undefined);
  }
}

async function handleFailedOrExpiredCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const bookingId = extractBookingIdFromSession(session);
  if (!bookingId) return;

  const payerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  const payerPhone = session.customer_details?.phone ?? null;

  const payerName = session.customer_details?.name ?? null;

  if (payerEmail || payerPhone || payerName) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        contactEmail: payerEmail ?? undefined,
        contactPhone: payerPhone ?? undefined,
        contactName: payerName ?? undefined,
      },
    });
  }

  await markBookingCancelledIfPending(bookingId);
}

export async function POST(req: NextRequest) {
  try {
    const whsec = getEnvOrThrow("STRIPE_WEBHOOK_SECRET");
    getEnvOrThrow("STRIPE_SECRET_KEY");

    const sig = req.headers.get("stripe-signature");
    if (!sig) return new NextResponse("Missing signature", { status: 400 });

    const rawBody = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, whsec);
    } catch (e: any) {
      console.error("❌ Webhook signature error:", e?.message);
      return new NextResponse("Invalid signature", { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulCheckoutSession(
          session,
          "checkout.session.completed",
        );
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulCheckoutSession(
          session,
          "checkout.session.async_payment_succeeded",
        );
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleFailedOrExpiredCheckoutSession(session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleFailedOrExpiredCheckoutSession(session);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = (pi.metadata?.bookingId as string) || null;

        if (bookingId) {
          await markBookingCancelledIfPending(bookingId);
        }
        break;
      }

      default:
        break;
    }

    return new NextResponse("ok", { status: 200 });
  } catch (err: any) {
    console.error("Webhook handling error:", err?.message || err);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
