// src/app/[club]/admin/activities/new/limit/page.tsx
import Link from "next/link";

export default function ActivityLimitPage({
  params,
}: { params: { club: string } }) {
  const baseActivities = `/${params.club}/admin/activities`;
  const billing = `/${params.club}/admin/billing`;

  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <div className="rounded-2xl u-border u-surface p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center rounded-full bg-amber-500/10 text-amber-400 size-12 mb-2">
          <span className="text-2xl">!</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Plan limit reached
        </h1>
        <p className="text-sm opacity-75">
          You&apos;ve reached the maximum number of activities allowed on your
          current plan. To add more courts or activities, upgrade your
          subscription.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={billing}
            className="inline-flex items-center justify-center rounded-xl h-11 px-5 text-sm font-medium btn-accent"
          >
            Upgrade plan
          </Link>
          <Link
            href={baseActivities}
            className="inline-flex items-center justify-center rounded-xl h-11 px-5 text-sm font-medium u-border u-surface hover:u-surface-2"
          >
            Back to activities
          </Link>
        </div>
      </div>
    </main>
  );
}