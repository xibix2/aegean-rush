// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { resend, FROM } from "@/lib/email";
import BookingConfirmed from "@/emails/BookingConfirmed";
import { createEvent } from "ics";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ simple ctor; no apiVersion to fight with TS
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ---------- Generic env helper ----------

function getEnvOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// ---------- Helper: build absolute URL for email images ----------

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

// ---------- Billing-plan helpers ----------

function planFromPriceId(priceId?: string | null): SubscriptionPlan {
  if (!priceId) return "BASIC";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return "ENTERPRISE";

  // Founder enterprise discounted price (if set) should still map to ENTERPRISE
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_FOUNDER) {
    return "ENTERPRISE";
  }

  return "BASIC";
}

function mapStripeSubStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
    default:
      return "INACTIVE";
  }
}

async function updateClubFromSubscription(args: {
  clubId: string;
  customerId: string;
  subscription: Stripe.Subscription;
}) {
  const priceId = args.subscription.items.data[0]?.price?.id ?? null;

  await prisma.club.update({
    where: { id: args.clubId },
    data: {
      stripeCustomerId: args.customerId,
      stripeSubscriptionId: args.subscription.id,
      stripePriceId: priceId ?? undefined,
      subscriptionPlan: planFromPriceId(priceId),
      subscriptionStatus: mapStripeSubStatus(args.subscription.status),
      trialEndsAt:
        args.subscription.trial_end != null
          ? new Date(args.subscription.trial_end * 1000)
          : null,
    },
  });
}

// ---------- Booking helpers ----------

// Helper to find booking + its tenant (clubId) + club currency
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

  // Scoped by tenant club (matches @@unique([clubId,email]))
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
  // We now reuse getBookingWithTenant so we also get club + tz data
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      timeSlot: {
        include: {
          activity: {
            include: {
              club: {
                include: {
                  setting: true, // <- get tz from AppSetting
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
  const clubName = club?.name ?? "Your club";
  const logoUrl = buildAbsoluteUrl(club?.logoKey ?? null);
  const brandPrimary = club?.primaryHex ?? null;

  // -------- Timezone handling --------
  // 1) Determine club timezone: club.setting.tz → process.env.TZ → "Europe/Athens"
  const clubTz =
    club?.setting?.tz?.trim() || process.env.TZ?.trim() || "Europe/Athens";

  // 2) Convert slot start/end (stored in UTC) to the club's local timezone
  const startLocal = toZonedTime(slotStart, clubTz);
  const endLocal = toZonedTime(slotEnd, clubTz);

  // 3) Build ICS event using local clock time in club timezone
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

  // ----- FROM logic (display name + email) -----

  const senderDisplayName =
    (club?.emailFromName && club.emailFromName.trim().length > 0
      ? club.emailFromName.trim()
      : clubName) || "Your club";

  function parseFromAddress(from: string): { email: string } {
    const match = from.match(/<(.*)>/);
    if (match) {
      return { email: match[1].trim() };
    }
    return { email: from.trim() };
  }

  const defaultFromEmail = parseFromAddress(FROM).email;

  // ✅ Always send *from* the verified Resend address,
  // just changing the display name to the club name.
  const from = `${senderDisplayName} <${defaultFromEmail}>`;

  // Optional: let replies go to the club’s own email if set.
  const replyTo =
    club?.emailFromEmail && club.emailFromEmail.includes("@")
      ? club.emailFromEmail.trim()
      : undefined;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Your booking at ${senderDisplayName} is confirmed ✅`,
      react: BookingConfirmed({
        activity: b.timeSlot.activity.name,
        // 💡 Pass local-times as ISO strings so email content reflects club time,
        // NOT raw UTC from the DB.
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

// capture club currency on the Payment row
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
      // ---- Checkout completed: can be booking OR subscription ----
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // booking flow: metadata.bookingId or client_reference_id
        const bookingId =
          (session.metadata?.bookingId as string | undefined) ||
          (session.client_reference_id as string | undefined) ||
          null;

        if (session.mode === "subscription") {
          // 👉 Subscription checkout for club billing
          const clubId = session.metadata?.clubId as string | undefined;
          if (clubId && session.customer && session.subscription) {
            const sub = await stripe.subscriptions.retrieve(
              session.subscription as string,
            );
            await updateClubFromSubscription({
              clubId,
              customerId: session.customer as string,
              subscription: sub,
            });
          }
        } else if (bookingId) {
          // 👉 Existing booking payment flow
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
              const pi = await stripe.paymentIntents.retrieve(
                paymentIntentId,
                {
                  expand: ["latest_charge"],
                },
              );
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
        }

        break;
      }

      // ---- Subscription lifecycle events ----
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const clubId = sub.metadata?.clubId as string | undefined;
        if (clubId && sub.customer) {
          await updateClubFromSubscription({
            clubId,
            customerId: sub.customer as string,
            subscription: sub,
          });
        }
        break;
      }

      // ---- Booking: session expired ----
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

      // ---- Booking: payment failed ----
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
        // ignore other events
        break;
    }

    return new NextResponse("ok", { status: 200 });
  } catch (err: any) {
    console.error("Webhook handling error:", err?.message || err);
    return new NextResponse("Webhook error", { status: 500 });
  }
}