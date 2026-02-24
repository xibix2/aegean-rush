// src/app/api/billing/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// Initialise Stripe once – will throw immediately if key is missing.
const stripe = new Stripe(env("STRIPE_SECRET_KEY"));

export async function POST(req: NextRequest) {
  try {
    // 1) Ensure we have a tenant + admin
    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);

    // 2) Load club with current connect info
    const club = await prisma.club.findUnique({
      where: { id: tenant.id },
      select: {
        id: true,
        slug: true,
        name: true,
        stripeConnectAccountId: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { ok: false, error: "Club not found" },
        { status: 404 }
      );
    }

    // 3) Ensure a Stripe Connect account exists (one per club)
    let accountId = club.stripeConnectAccountId;

    if (!accountId) {
      // You can tweak 'country' if you want, but for test mode this is fine.
      const account = await stripe.accounts.create({
        type: "express",
        metadata: {
          clubId: club.id,
          slug: club.slug,
        },
      });

      accountId = account.id;

      await prisma.club.update({
        where: { id: club.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    // 4) Build return / refresh URLs based on the current origin
    const origin = req.nextUrl.origin.replace(/\/+$/, "");
    const base = `/${club.slug}/admin/billing`;

    const refreshUrl = `${origin}${base}?connect=refresh`;
    const returnUrl = `${origin}${base}?connect=success`;

    // 5) Create an account onboarding link
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({ ok: true, url: link.url });
  } catch (err: any) {
    console.error("[billing/connect] error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}