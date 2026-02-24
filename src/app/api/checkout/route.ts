// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  activityId: z.string().cuid(),
  timeSlotId: z.string().cuid().optional(),
  slotId: z.string().cuid().optional(),
  partySize: z.coerce.number().int().min(1),
  customer: z
    .object({
      email: z.string().email().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// ✅ Resolve base URL from env OR request (works in dev + prod)
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

// 🧩 Helper to build "/{slug}" (or "" on the root)
function getTenantBase(req: NextRequest, tenantSlug?: string | null) {
  const headerSlug = (req.headers.get("x-tenant-slug") || "").trim();
  const slug = headerSlug || (tenantSlug ?? "");
  return slug ? `/${slug}` : "";
}

// ⚠️ construct at module scope (envs must be set)
const stripe = new Stripe(env("STRIPE_SECRET_KEY"));

async function createSessionAndMaybeRedirect(
  req: NextRequest,
  payload: z.infer<typeof Body>,
) {
  const baseUrl = getBaseUrl(req);

  const { activityId, timeSlotId, slotId, partySize, customer } = payload;
  const tsId = timeSlotId ?? slotId!;
  if (!tsId) {
    return NextResponse.json(
      { error: "timeSlotId is required" },
      { status: 400 },
    );
  }

  // 🔒 Tenant (header -> cookie)
  const tenant = await requireTenant();
  const currency = (tenant.currency || "EUR").toLowerCase();

  // Build "/{slug}" once and reuse below
  const tenantBase = getTenantBase(req, (tenant as any)?.slug);

  // 🔒 Activity must belong to tenant
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, clubId: tenant.id, active: true },
    select: { id: true, name: true, clubId: true },
  });
  if (!activity) {
    return NextResponse.json(
      { error: "Activity not found for tenant" },
      { status: 404 },
    );
  }

  // Load slot + activity + current holds, but ensure slot belongs to same tenant & activity
  const slot = await prisma.timeSlot.findFirst({
    where: {
      id: tsId,
      activity: { id: activityId, clubId: tenant.id },
    },
    include: {
      activity: {
        select: { id: true, name: true, clubId: true, basePrice: true },
      },
      bookings: {
        select: { status: true, partySize: true, createdAt: true },
      },
    },
  });
  if (!slot) {
    return NextResponse.json(
      { error: "Time slot not found for tenant/activity" },
      { status: 404 },
    );
  }

  // Capacity check (paid + fresh pending <30m)
  const now = Date.now();
  const held = slot.bookings.reduce((sum, b) => {
    const freshPending =
      b.status === "pending" &&
      (now - new Date(b.createdAt).getTime()) / 60000 < 30;
    const paid = b.status === "paid";
    return sum + (paid || freshPending ? b.partySize : 0);
  }, 0);
  const remaining = Math.max(0, slot.capacity - held);
  if (remaining < partySize) {
    return NextResponse.json(
      { error: "Not enough seats left" },
      { status: 409 },
    );
  }

  // DB customer (scoped to tenant club)
  let dbCustomerId: string;
  if (customer?.email) {
    const c = await prisma.customer.upsert({
      // matches @@unique([clubId, email])
      where: { clubId_email: { clubId: tenant.id, email: customer.email } },
      update: {
        name: customer.name ?? undefined,
        phone: customer.phone ?? null,
      },
      create: {
        clubId: tenant.id,
        email: customer.email,
        name: customer.name ?? "Customer",
        phone: customer.phone ?? null,
      },
    });
    dbCustomerId = c.id;
  } else {
    const guest = await prisma.customer.create({
      data: {
        clubId: tenant.id,
        name: "Guest",
        email: `guest+${Date.now()}@example.com`,
      },
    });
    dbCustomerId = guest.id;
  }

  // Ensure unit is a number (no nulls) to satisfy Stripe types
  const unitRaw =
    (slot as any).priceCents ?? (slot.activity as any).basePrice ?? 0;
  const unit =
    typeof unitRaw === "number" &&
    Number.isFinite(unitRaw) &&
    unitRaw >= 0
      ? unitRaw
      : 0;

  const total = unit * partySize;

  // Pending booking (activity/slot already tenant-validated)
  const booking = await prisma.booking.create({
    data: {
      customerId: dbCustomerId,
      activityId,
      timeSlotId: slot.id,
      partySize,
      totalPrice: total,
      status: "pending",
    },
  });

  // 🔁 load club payout account (for Stripe Connect)
  const clubForPayout = await prisma.club.findUnique({
    where: { id: tenant.id },
    select: { stripeConnectAccountId: true },
  });

  const successUrl = `${baseUrl}${tenantBase}/booking/${booking.id}?status=success`;
  const cancelUrl = `${baseUrl}${tenantBase}/booking/${booking.id}?status=cancelled`;

  // Build payment_intent_data with optional transfer_data to the club account
  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData =
    {
      metadata: {
        bookingId: booking.id,
        timeSlotId: slot.id,
        tenantSlug: tenantBase.replace("/", ""),
      },
    };

  // If the club has connected Stripe, send 100% of the payment to them
  if (clubForPayout?.stripeConnectAccountId) {
    paymentIntentData.transfer_data = {
      destination: clubForPayout.stripeConnectAccountId,
    };
    // ❗ No application_fee_amount here = no platform cut
  }

  // Stripe Checkout Session (expire in 30 minutes)
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_creation: "always",
    client_reference_id: booking.id,
    metadata: {
      bookingId: booking.id,
      timeSlotId: slot.id,
      tenantSlug: tenantBase.replace("/", ""),
    },
    payment_intent_data: paymentIntentData,
    customer_email: customer?.email,
    line_items: [
      {
        quantity: partySize,
        price_data: {
          currency: currency,
          unit_amount: unit,
          product_data: { name: slot.activity.name },
        },
      },
    ],
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  // Optional: store stub
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: "stripe",
      providerIntentId: session.id, // will be updated by webhook with PI id
      amount: total,
      status: "requires_action",
    },
  });

  const ct = req.headers.get("content-type") || "";
  const wantsHtml = (req.headers.get("accept") || "").includes("text/html");

  // If it's a browser navigation (GET or form post), redirect to Stripe
  if (
    req.method === "GET" ||
    wantsHtml ||
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  ) {
    return NextResponse.redirect(session.url!, { status: 303 });
  }

  // Otherwise (XHR/fetch POST), return JSON
  return NextResponse.json({ url: session.url });
}

export async function POST(req: NextRequest) {
  try {
    // Accept form posts or JSON
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
    // Support ?activityId=&timeSlotId= or slotId=&partySize=&email=&name=&phone=
    const url = new URL(req.url);
    const data = {
      activityId: url.searchParams.get("activityId"),
      timeSlotId: url.searchParams.get("timeSlotId"),
      slotId: url.searchParams.get("slotId"),
      partySize: url.searchParams.get("partySize"),
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