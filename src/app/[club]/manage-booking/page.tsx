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
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">
          Manage booking
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
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
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-pink-400/40"
              required
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-5 text-sm font-medium text-white shadow-[0_12px_40px_-16px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
          >
            Open booking
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/58">
          Your access token should come from your booking confirmation flow or
          booking email. Once opened, you’ll be able to review your booking and
          cancel it if it is still within the allowed cancellation window.
        </div>
      </div>
    </div>
  );
}