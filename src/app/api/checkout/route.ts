import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant";
import { getBookingQuoteAndAvailability } from "@/lib/booking-engine";
import { ActivityMode } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  activityId: z.string().cuid(),
  timeSlotId: z.string().cuid().optional(),
  slotId: z.string().cuid().optional(),

  // fixed event
  partySize: z.coerce.number().int().min(1).optional(),

  // rental / hybrid
  startTime: z.union([z.string(), z.date()]).optional(),
  durationOptionId: z.string().cuid().optional(),
  units: z.coerce.number().int().min(1).optional(),
  guests: z.coerce.number().int().min(1).optional(),

  customer: z
    .object({
      email: z.string().email().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

const PLATFORM_FEE_PERCENT = 0.2;

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getBaseUrl(req: NextRequest) {
  const requestOrigin = req.nextUrl?.origin;

  if (process.env.NODE_ENV === "production") {
    const fromEnv =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      null;
    if (fromEnv) return fromEnv.replace(/\/+$/, "");
  }

  return requestOrigin?.replace(/\/+$/, "") ?? "http://localhost:3000";
}

function getTenantBase(req: NextRequest, tenantSlug?: string | null) {
  const headerSlug = (req.headers.get("x-tenant-slug") || "").trim();
  const slug = headerSlug || (tenantSlug ?? "");
  return slug ? `/${slug}` : "";
}

const stripe = new Stripe(env("STRIPE_SECRET_KEY"));

function getCheckoutConflictStatus(errors: string[]) {
  const availabilityError = errors.some((e) =>
    [
      "Not enough seats left.",
      "Not enough units available for the selected time range.",
      "This slot has no available capacity.",
    ].includes(e),
  );

  return availabilityError ? 409 : 400;
}

function buildStripeLineItem(args: {
  activityName: string;
  mode: ActivityMode;
  unitPrice: number;
  quantity: number;
  pricingLabel: string | null;
  durationMin: number | null;
}) {
  const { activityName, mode, unitPrice, quantity, pricingLabel, durationMin } = args;

  let suffix = "";

  if (mode === ActivityMode.FIXED_SEAT_EVENT) {
    suffix = "Seat";
  } else if (pricingLabel) {
    suffix = pricingLabel;
  } else if (durationMin) {
    suffix = `${durationMin} min`;
  } else {
    suffix = "Unit booking";
  }

  return {
    quantity,
    price_data: {
      currency: "eur",
      unit_amount: unitPrice,
      product_data: {
        name: `${activityName}${suffix ? ` — ${suffix}` : ""}`,
      },
    },
  };
}

async function findOrCreateCustomer(params: {
  clubId: string;
  email?: string;
  name?: string;
  phone?: string;
}) {
  const { clubId, email, name, phone } = params;

  if (email) {
    const c = await prisma.customer.upsert({
      where: { clubId_email: { clubId, email } },
      update: {
        name: name ?? undefined,
        phone: phone ?? null,
      },
      create: {
        clubId,
        email,
        name: name ?? "Customer",
        phone: phone ?? null,
      },
    });
    return c.id;
  }

  const guest = await prisma.customer.create({
    data: {
      clubId,
      name: name?.trim() || "Guest",
      email: `guest+${Date.now()}@example.com`,
      phone: phone ?? null,
    },
  });

  return guest.id;
}

async function createSessionAndMaybeRedirect(
  req: NextRequest,
  payload: z.infer<typeof Body>,
) {
  const baseUrl = getBaseUrl(req);

  const {
    activityId,
    timeSlotId,
    slotId,
    partySize,
    startTime,
    durationOptionId,
    units,
    guests,
    customer,
  } = payload;

  const tsId = timeSlotId ?? slotId;
  if (!tsId) {
    return NextResponse.json(
      { error: "timeSlotId is required" },
      { status: 400 },
    );
  }

  const tenant = await requireTenant();
  const currency = (tenant.currency || "EUR").toLowerCase();
  const tenantBase = getTenantBase(req, (tenant as any)?.slug);

  const slot = await prisma.timeSlot.findFirst({
    where: {
      id: tsId,
      activity: {
        id: activityId,
        clubId: tenant.id,
        active: true,
      },
    },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          mode: true,
          minParty: true,
          maxParty: true,
          basePrice: true,
          guestsPerUnit: true,
          maxUnitsPerBooking: true,
          slotIntervalMin: true,
          durationOptions: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              label: true,
              durationMin: true,
              priceCents: true,
              isActive: true,
              sortOrder: true,
            },
          },
        },
      },
      bookings: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          partySize: true,
          reservedUnits: true,
          bookingStartAt: true,
          bookingEndAt: true,
        },
      },
    },
  });

  if (!slot) {
    return NextResponse.json(
      { error: "Time slot not found for tenant/activity" },
      { status: 404 },
    );
  }

  const quote = getBookingQuoteAndAvailability({
    activity: slot.activity,
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
    startTime,
    durationOptionId,
    units,
    guests,
  });

  if (!quote.isValid) {
    return NextResponse.json(
      {
        error: quote.errors[0] ?? "Invalid booking request",
        errors: quote.errors,
      },
      { status: getCheckoutConflictStatus(quote.errors) },
    );
  }

  const customerId = await findOrCreateCustomer({
    clubId: tenant.id,
    email: customer?.email,
    name: customer?.name,
    phone: customer?.phone,
  });

  const booking = await prisma.booking.create({
    data: {
      customerId,
      activityId,
      timeSlotId: slot.id,
      partySize: quote.partySize,
      totalPrice: quote.totalPrice,
      status: "pending",

      contactName: customer?.name?.trim() || "Guest",
      contactEmail: customer?.email?.trim() || null,
      contactPhone: customer?.phone?.trim() || null,

      reservedUnits: quote.reservedUnits,
      bookingStartAt: quote.bookingStartAt,
      bookingEndAt: quote.bookingEndAt,
      durationMinSnapshot: quote.durationMin,
      unitPriceSnapshot: quote.unitPrice,
      pricingLabelSnapshot: quote.pricingLabel,
    },
  });

  const clubForPayout = await prisma.club.findUnique({
    where: { id: tenant.id },
    select: { stripeConnectAccountId: true },
  });

  const successUrl = `${baseUrl}${tenantBase}/booking/${booking.publicToken}?status=success`;
  const cancelUrl = `${baseUrl}${tenantBase}/booking/${booking.publicToken}?status=cancelled`;

  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData =
    {
      metadata: {
        bookingId: booking.id,
        timeSlotId: slot.id,
        activityId,
        tenantSlug: tenantBase.replace("/", ""),
        activityMode: quote.mode,
        bookingStartAt: quote.bookingStartAt.toISOString(),
        bookingEndAt: quote.bookingEndAt.toISOString(),
        reservedUnits: String(quote.reservedUnits),
        partySize: String(quote.partySize),
      },
    };

  if (clubForPayout?.stripeConnectAccountId) {
    const applicationFeeAmount = Math.round(
      quote.totalPrice * PLATFORM_FEE_PERCENT,
    );

    paymentIntentData.transfer_data = {
      destination: clubForPayout.stripeConnectAccountId,
    };

    paymentIntentData.application_fee_amount = applicationFeeAmount;
  }

  const stripeQuantity =
    quote.mode === ActivityMode.FIXED_SEAT_EVENT
      ? quote.partySize
      : quote.reservedUnits;

  const stripeLineItem = buildStripeLineItem({
    activityName: slot.activity.name,
    mode: quote.mode,
    unitPrice: quote.unitPrice,
    quantity: stripeQuantity,
    pricingLabel: quote.pricingLabel,
    durationMin: quote.durationMin,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_creation: "always",
    client_reference_id: booking.id,
    metadata: {
      bookingId: booking.id,
      timeSlotId: slot.id,
      activityId,
      tenantSlug: tenantBase.replace("/", ""),
      activityMode: quote.mode,
    },
    payment_intent_data: paymentIntentData,
    customer_email: customer?.email,
    line_items: [
      {
        ...stripeLineItem,
        price_data: {
          ...stripeLineItem.price_data,
          currency,
        },
      },
    ],
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: "stripe",
      providerIntentId: session.id,
      amount: quote.totalPrice,
      currency: currency.toUpperCase(),
      status: "requires_action",
    },
  });

  const ct = req.headers.get("content-type") || "";
  const wantsHtml = (req.headers.get("accept") || "").includes("text/html");

  if (
    req.method === "GET" ||
    wantsHtml ||
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  ) {
    return NextResponse.redirect(session.url!, { status: 303 });
  }

  return NextResponse.json({ url: session.url });
}

export async function POST(req: NextRequest) {
  try {
    let data: unknown;
    const ct = req.headers.get("content-type") || "";

    if (
      ct.includes("application/x-www-form-urlencoded") ||
      ct.includes("multipart/form-data")
    ) {
      const form = await req.formData();

      data = {
        activityId: form.get("activityId"),
        timeSlotId: form.get("timeSlotId"),
        slotId: form.get("slotId"),
        partySize: form.get("partySize"),

        startTime: (form.get("startTime") as string) || undefined,
        durationOptionId: (form.get("durationOptionId") as string) || undefined,
        units: form.get("units"),
        guests: form.get("guests"),

        customer: {
          email: (form.get("email") as string) || undefined,
          name: (form.get("name") as string) || undefined,
          phone: (form.get("phone") as string) || undefined,
        },
      };
    } else {
      data = await req.json();
    }

    const parsed = Body.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Bad request" },
        { status: 400 },
      );
    }

    return createSessionAndMaybeRedirect(req, parsed.data);
  } catch (err: any) {
    console.error("Checkout error (POST):", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const data = {
      activityId: url.searchParams.get("activityId") || undefined,
      timeSlotId: url.searchParams.get("timeSlotId") || undefined,
      slotId: url.searchParams.get("slotId") || undefined,
      partySize: url.searchParams.get("partySize") || undefined,

      startTime: url.searchParams.get("startTime") || undefined,
      durationOptionId: url.searchParams.get("durationOptionId") || undefined,
      units: url.searchParams.get("units") || undefined,
      guests: url.searchParams.get("guests") || undefined,

      customer: {
        email: url.searchParams.get("email") || undefined,
        name: url.searchParams.get("name") || undefined,
        phone: url.searchParams.get("phone") || undefined,
      },
    };

    const parsed = Body.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Bad request" },
        { status: 400 },
      );
    }

    return createSessionAndMaybeRedirect(req, parsed.data);
  } catch (err: any) {
    console.error("Checkout error (GET):", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}