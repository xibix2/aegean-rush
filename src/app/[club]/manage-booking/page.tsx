import { requireTenant } from "@/lib/tenant";

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { club } = await params;
  const tenant = await requireTenant(club);
  const qp = searchParams ? await searchParams : undefined;
  const hasError = qp?.error === "missing-token";

  return (
    <main className="customer-page mx-auto max-w-2xl px-3 py-8 sm:px-4 sm:py-16">
      <section className="customer-hero rounded-3xl p-5 sm:rounded-[2rem] sm:p-8">
        <p className="customer-kicker">
          Manage booking
        </p>

        <h1 className="customer-title mt-4 text-3xl">
          View or cancel your booking
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-white/62 md:text-base">
          Enter your booking access token to open your booking details and, if
          eligible, cancel it online.
        </p>

        {hasError ? (
          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Please enter a booking access token first.
          </div>
        ) : null}

        <form
          action={`/${tenant.slug}/manage-booking/lookup`}
          method="GET"
          className="mt-6 space-y-4"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/80">
              Booking access token
            </span>
            <input
              type="text"
              name="token"
              placeholder="Paste your booking token"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-base text-white placeholder:text-white/30 outline-none transition sm:text-sm"
              required
            />
          </label>

          <button
            type="submit"
            className="customer-primary inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-medium transition sm:w-auto"
          >
            Open booking
          </button>
        </form>

        <div className="customer-panel mt-6 rounded-xl px-4 py-4 text-sm text-white/58">
          Your access token should come from your booking confirmation flow or
          booking email. Once opened, you’ll be able to review your booking and
          cancel it if it is still within the allowed cancellation window.
        </div>
      </section>
    </main>
  );
}
