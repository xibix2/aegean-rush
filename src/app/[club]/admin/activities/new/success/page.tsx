// src/app/[club]/admin/activities/new/success/page.tsx
import Link from "next/link";

export default function ActivityCreatedSuccessPage({
  params,
}: { params: { club: string } }) {
  const base = `/${params.club}/admin/activities`;

  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <div className="rounded-2xl u-border u-surface p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 size-12 mb-2">
          <span className="text-2xl">✓</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Experience created
        </h1>

        <p className="text-sm opacity-75">
          Your new experience has been created successfully. You can now add
          time slots and start accepting bookings.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={base}
            className="inline-flex items-center justify-center rounded-xl h-11 px-5 text-sm font-medium btn-accent"
          >
            Go to experiences
          </Link>

          <Link
            href={`/${params.club}/admin/activities/new`}
            className="inline-flex items-center justify-center rounded-xl h-11 px-5 text-sm font-medium u-border u-surface hover:u-surface-2"
          >
            Create another
          </Link>
        </div>
      </div>
    </main>
  );
}