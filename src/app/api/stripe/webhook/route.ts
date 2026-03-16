// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { resend, FROM } from "@/lib/email";
import BookingConfirmed from "@/emails/BookingConfirmed";
import { createEvent } from "ics";
import { toZonedTime } from "date-fns-tz";

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

// ---------- Booking helpers ----------

async function getBookingWithTenant(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
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
) {
  if (!email) return;

  const booking = await getBookingWithTenant(bookingId);
  if (!booking) return;

  const clubId = booking.timeSlot?.activity.clubId;
  if (!clubId) return;

  const real = await prisma.customer.upsert({
    where: { clubId_email: { clubId, email } },
    create: { clubId, email, name: name || "Customer" },
    update: { name: name || undefined },
  });

  if (booking.customerId === real.id) {
    if (name) {
      await prisma.customer.update({
        where: { id: real.id },
        data: { name },
      });
    }
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { customerId: real.id },
  });
}

async function sendConfirmationEmail(
  bookingId: string,
  fallbackEmail?: string,
) {
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
    },
  });
  if (!b) return;

  let to = fallbackEmail ?? b.customer?.email ?? null;

  if (fallbackEmail && to && to.startsWith("guest+")) {
    try {
      await prisma.customer.update({
        where: { id: b.customerId },
        data: { email: fallbackEmail },
      });
      to = fallbackEmail;
    } catch {}
  }
  if (!to) return;

  const slotStart = b.timeSlot.startAt;
  const slotEnd =
    b.timeSlot.endAt ??
    new Date(b.timeSlot.startAt.getTime() + 90 * 60 * 1000);

  const club = b.timeSlot.activity.club;
  const clubName = club?.name ?? "Your business";
  const logoUrl = buildAbsoluteUrl(club?.logoKey ?? null);
  const brandPrimary = club?.primaryHex ?? null;

  const clubTz =
    club?.setting?.tz?.trim() || process.env.TZ?.trim() || "Europe/Athens";

  const startLocal = toZonedTime(slotStart, clubTz);
  const endLocal = toZonedTime(slotEnd, clubTz);

  const { error, value } = createEvent({
    title: b.timeSlot.activity.name,
    start: [
      startLocal.getFullYear(),
      startLocal.getMonth() + 1,
      startLocal.getDate(),
      startLocal.getHours(),
      startLocal.getMinutes(),
    ],
    end: [
      endLocal.getFullYear(),
      endLocal.getMonth() + 1,
      endLocal.getDate(),
      endLocal.getHours(),
      endLocal.getMinutes(),
    ],
    description: `Meeting point: ${clubName}`,
    status: "CONFIRMED",
  });
  const icsBase64 = error ? undefined : Buffer.from(value!).toString("base64");

  const senderDisplayName =
    (club?.emailFromName && club.emailFromName.trim().length > 0
      ? club.emailFromName.trim()
      : clubName) || "Your business";

  function parseFromAddress(from: string): { email: string } {
    const match = from.match(/<(.*)>/);
    if (match) {
      return { email: match[1].trim() };
    }
    return { email: from.trim() };
  }

  const defaultFromEmail = parseFromAddress(FROM).email;
  const from = `${senderDisplayName} <${defaultFromEmail}>`;

  const replyTo =
    club?.emailFromEmail && club.emailFromEmail.includes("@")
      ? club.emailFromEmail.trim()
      : undefined;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Your booking with ${senderDisplayName} is confirmed ✅`,
      react: BookingConfirmed({
        activity: b.timeSlot.activity.name,
        startISO: startLocal.toISOString(),
        endISO: endLocal.toISOString(),
        partySize: b.partySize,
        totalCents: b.totalPrice!,
        clubName: senderDisplayName,
        logoUrl,
        brandPrimary,
      }),
      ...(replyTo ? { reply_to: replyTo } : {}),
      attachments: icsBase64
        ? [{ filename: "booking.ics", content: icsBase64 }]
        : undefined,
    });
  } catch (e) {
    console.error("❌ Resend error:", (e as any)?.message || e);
  }
}

async function markBookingPaid(
  bookingId: string,
  providerIntentId?: string | null,
  amount?: number | null,
) {
  const b = await getBookingWithTenant(bookingId);
  if (!b) return;

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

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "paid" },
  });
}

// ---------- Webhook handler ----------

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

        const bookingId =
          (session.metadata?.bookingId as string | undefined) ||
          (session.client_reference_id as string | undefined) ||
          null;

        if (!bookingId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const amount = session.amount_total ?? null;
        const payerEmail =
          session.customer_details?.email ?? session.customer_email ?? null;

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

        console.log("✅ checkout.session.completed (booking)", {
          bookingId,
          sessionId: session.id,
          payerEmail,
          payerName,
        });

        await markBookingPaid(bookingId, paymentIntentId, amount);
        await attachRealCustomerToBooking(bookingId, payerEmail, payerName);
        await sendConfirmationEmail(bookingId, payerEmail || undefined);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId =
          (session.metadata?.bookingId as string | undefined) ||
          (session.client_reference_id as string | undefined) ||
          null;

        if (bookingId) {
          await prisma.booking.updateMany({
            where: { id: bookingId, status: "pending" as any },
            data: { status: "cancelled" as any },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = (pi.metadata?.bookingId as string) || null;

        if (bookingId) {
          await prisma.booking.updateMany({
            where: { id: bookingId, status: "pending" as any },
            data: { status: "cancelled" as any },
          });
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