// src/lib/billing.ts
import { SubscriptionPlan } from "@prisma/client";

/**
 * Central Stripe price IDs.
 *
 * We first try environment variables (for production / Vercel),
 * and if they are missing we fall back to the hard-coded test
 * price IDs you gave me.
 *
 * This means everything works even if env loading is buggy.
 */

// Test price IDs (from your Stripe test account)
const FALLBACK_BASIC = "price_1SXbIKIZhRHwblwMt1wtIGAa";
const FALLBACK_PRO = "price_1SXbJ6IZhRHwblwMcVSutkYx";
const FALLBACK_ENTERPRISE = "price_1SXbKdIZhRHwblwMqSkEM6kw";
// Founder €39 enterprise price
const FALLBACK_ENTERPRISE_FOUNDER = "price_1SYTmBIZhRHwblwMDMn6aSlG";

export const PRICE_BASIC =
  process.env.STRIPE_PRICE_BASIC || FALLBACK_BASIC;

export const PRICE_PRO =
  process.env.STRIPE_PRICE_PRO || FALLBACK_PRO;

export const PRICE_ENTERPRISE =
  process.env.STRIPE_PRICE_ENTERPRISE || FALLBACK_ENTERPRISE;

export const PRICE_ENTERPRISE_FOUNDER =
  process.env.STRIPE_PRICE_ENTERPRISE_FOUNDER ||
  process.env.FOUNDER_ENTERPRISE_PRICE_ID ||
  FALLBACK_ENTERPRISE_FOUNDER;

/**
 * Map our internal plan enum → Stripe Price ID.
 */
export function getStripePriceIdForPlan(plan: SubscriptionPlan): string {
  switch (plan) {
    case "BASIC":
      return PRICE_BASIC;
    case "PRO":
      return PRICE_PRO;
    case "ENTERPRISE":
      return PRICE_ENTERPRISE;
    default:
      return PRICE_BASIC;
  }
}

/**
 * Map Stripe price ID → internal plan enum.
 * Used in the webhook when we get a subscription from Stripe.
 */
export function resolvePlanFromPriceId(
  priceId?: string | null,
): SubscriptionPlan {
  if (!priceId) return "BASIC";

  if (priceId === PRICE_PRO) return "PRO";

  if (
    priceId === PRICE_ENTERPRISE ||
    priceId === PRICE_ENTERPRISE_FOUNDER
  ) {
    return "ENTERPRISE";
  }

  if (priceId === PRICE_BASIC) return "BASIC";

  // Unknown price → don’t break, just fall back
  return "BASIC";
}

/**
 * Optional: metadata for UI / superadmin pages.
 * (unchanged from before, you can tweak prices later)
 */
export const PLAN_META: Record<
  SubscriptionPlan,
  {
    label: string;
    monthlyPrice: number; // just for display, not trusted for billing
    maxCourts: number | "unlimited";
  }
> = {
  BASIC: {
    label: "Basic",
    monthlyPrice: 39,
    maxCourts: 2,
  },
  PRO: {
    label: "Pro",
    monthlyPrice: 79,
    maxCourts: 5,
  },
  ENTERPRISE: {
    label: "Enterprise",
    monthlyPrice: 149,
    maxCourts: "unlimited",
  },
};

export function getPlanLimits(plan: SubscriptionPlan) {
  const meta = PLAN_META[plan] ?? PLAN_META.BASIC;
  const maxActivities =
    meta.maxCourts === "unlimited" ? Infinity : meta.maxCourts;

  return {
    maxActivities,
  };
}