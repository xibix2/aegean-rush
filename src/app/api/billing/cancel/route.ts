// src/app/api/billing/cancel/route.ts
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

const stripe = new Stripe(env("STRIPE_SECRET_KEY"));

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);

    const club = await prisma.club.findUnique({
      where: { id: tenant.id },
      select: {
        id: true,
        slug: true,
        name: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { ok: false, error: "Club not found" },
        { status: 404 },
      );
    }

    if (!club.stripeSubscriptionId) {
      return NextResponse.json(
        { ok: false, error: "No active subscription to cancel" },
        { status: 400 },
      );
    }

    let stripeErrorIsResourceMissing = false;

    try {
      await stripe.subscriptions.cancel(club.stripeSubscriptionId);
    } catch (err: any) {
      // If subscription doesn't exist in Stripe (e.g. test vs live mismatch),
      // treat it as already cancelled.
      if (err && typeof err === "object" && (err as any).code === "resource_missing") {
        stripeErrorIsResourceMissing = true;
        console.warn(
          "[billing/cancel] subscription missing in Stripe, marking as canceled locally",
          club.stripeSubscriptionId,
        );
      } else {
        throw err;
      }
    }

    await prisma.club.update({
      where: { id: club.id },
      data: {
        subscriptionStatus: "CANCELED",
        // Optional: clear IDs if you don't need them anymore
        // stripeSubscriptionId: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[billing/cancel] error", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "Unable to cancel subscription" },
      { status: 500 },
    );
  }
}