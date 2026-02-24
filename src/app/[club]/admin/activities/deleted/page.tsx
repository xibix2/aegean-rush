// src/app/[club]/admin/activities/deleted/page.tsx
import Link from "next/link";

export default function ActivityDeletedPage({
  params,
}: { params: { club: string } }) {
  const baseActivities = `/${params.club}/admin/activities`;

  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <div className="rounded-2xl u-border u-surface p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center rounded-full bg-rose-500/10 text-rose-400 size-12 mb-2">
          <span className="text-2xl">🗑️</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Activity deleted
        </h1>
        <p className="text-sm opacity-75">
          The activity has been removed from your club. Existing bookings for
          this activity (if any) will no longer be available for new players.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={baseActivities}
            className="inline-flex items-center justify-center rounded-xl h-11 px-5 text-sm font-medium btn-accent"
          >
            Back to activities
          </Link>
        </div>
      </div>
    </main>
  );
}