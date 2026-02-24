// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import { SubscriptionPlan } from "@prisma/client";
import {
  getStripePriceIdForPlan,
  PRICE_ENTERPRISE_FOUNDER,
} from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  plan?: SubscriptionPlan | string;
  founderCode?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    // ✅ Lazy Stripe init (prevents whole app from breaking if env is missing)
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("[billing/checkout] Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { ok: false, error: "Billing is not configured" },
        { status: 500 },
      );
    }
    const stripe = new Stripe(stripeKey);

    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);

    let body: Body | null = null;
    try {
      body = (await req.json()) as Body;
    } catch {
      body = null;
    }

    const rawPlan = body?.plan;
    const plan =
      typeof rawPlan === "string"
        ? (rawPlan.toUpperCase() as SubscriptionPlan)
        : rawPlan;

    if (!plan || !["BASIC", "PRO", "ENTERPRISE"].includes(plan)) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan" },
        { status: 400 },
      );
    }

    // --- Code logic (re-using founderCode input) ---
    const rawFounderCode = (body?.founderCode ?? "").trim();

    const envFounder = (process.env.FOUNDER_CODE ?? "FOUNDER39").trim();
    const isFounderDeal =
      plan === "ENTERPRISE" &&
      rawFounderCode.length > 0 &&
      envFounder.length > 0 &&
      rawFounderCode.toUpperCase() === envFounder.toUpperCase();

    const envFree99 = (process.env.ENTERPRISE_FREE99_CODE ?? "FREE99").trim();
    const isFree99Deal =
      plan === "ENTERPRISE" &&
      !isFounderDeal &&
      rawFounderCode.length > 0 &&
      envFree99.length > 0 &&
      rawFounderCode.toUpperCase() === envFree99.toUpperCase();

    const club = await prisma.club.findUnique({
      where: { id: tenant.id },
      select: {
        id: true,
        slug: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { ok: false, error: "Club not found" },
        { status: 404 },
      );
    }

    let customerId = club.stripeCustomerId ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: club.name,
        metadata: { clubId: club.id, slug: club.slug },
      });

      customerId = customer.id;

      await prisma.club.update({
        where: { id: club.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Resolve Stripe price (+ optional discounts)
    let priceId: string | null = null;
    let discounts: { coupon: string }[] | undefined = undefined;

    if (isFounderDeal) {
      priceId = PRICE_ENTERPRISE_FOUNDER;
    } else if (isFree99Deal) {
      priceId = process.env.STRIPE_PRICE_ENTERPRISE_99 ?? null;
      const couponId = process.env.STRIPE_COUPON_FREE_FIRST_MONTH ?? "";

      if (!priceId) {
        return NextResponse.json(
          { ok: false, error: "Missing STRIPE_PRICE_ENTERPRISE_99 env" },
          { status: 500 },
        );
      }
      if (!couponId) {
        return NextResponse.json(
          { ok: false, error: "Missing STRIPE_COUPON_FREE_FIRST_MONTH env" },
          { status: 500 },
        );
      }

      discounts = [{ coupon: couponId }];
    } else {
      priceId = getStripePriceIdForPlan(plan);
    }

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: "Missing Stripe price for plan" },
        { status: 500 },
      );
    }

    const origin = req.nextUrl.origin;
    const successUrl = `${origin}/${club.slug}/admin/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/${club.slug}/admin/billing?canceled=1`;

    const founderMetadata = isFounderDeal ? "1" : "0";
    const free99Metadata = isFree99Deal ? "1" : "0";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      discounts, // undefined is fine
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        clubId: club.id,
        slug: club.slug,
        plan,
        source: "billing-page",
        founderDeal: founderMetadata,
        free99Deal: free99Metadata,
      },
      subscription_data: {
        metadata: {
          clubId: club.id,
          slug: club.slug,
          plan,
          source: "billing-page",
          founderDeal: founderMetadata,
          free99Deal: free99Metadata,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { ok: false, error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[billing/checkout] error", err);
    return NextResponse.json(
      { ok: false, error: "Unable to start checkout" },
      { status: 500 },
    );
  }
}