// src/app/onboarding/[club]/billing/page.tsx
import prisma from "@/lib/prisma";
import OnboardingBillingClient from "@/components/onboarding/OnboardingBillingClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: { club: string } | Promise<{ club: string }>;
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, any>>;
};

export default async function OnboardingBillingPage({ params, searchParams }: PageProps) {
  // ✅ In some production builds, params/searchParams can be promise-like.
  const p = await Promise.resolve(params as any);
  const sp = searchParams ? await Promise.resolve(searchParams as any) : undefined;

  const slug = p?.club;

  if (!slug || typeof slug !== "string") {
    throw new Error(`[onboarding/billing] Missing club slug in route params`);
  }

  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  if (!club) {
    throw new Error(`Club not found for slug "${slug}"`);
  }

  const fromSignup =
    (typeof sp?.from === "string" ? sp.from : undefined) === "signup";

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-accent-gradient">Choose your plan</span>
        </h1>
        <p className="text-sm opacity-75">
          {fromSignup
            ? `Welcome, ${club.name}. Pick a subscription to activate your business. You can change plans later.`
            : `Manage the subscription for ${club.name}.`}
        </p>
      </header>

      <OnboardingBillingClient
        clubSlug={club.slug}
        clubName={club.name}
        currentPlan={club.subscriptionPlan as any}
        subscriptionStatus={club.subscriptionStatus as any}
      />
    </main>
  );
}