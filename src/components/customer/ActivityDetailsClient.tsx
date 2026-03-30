"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getT } from "@/components/I18nProvider";

type ActivityDetails = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  durationMin: number | null;
  maxParty: number | null;
  basePrice: number | null;
  coverImageUrl: string | null;
  locationId: string | null;
};

type TFn = (key: string) => string;

const RESERVED = new Set([
  "api",
  "clubs",
  "admin",
  "login",
  "forgot-password",
  "reset-password",
  "signup",
  "privacy",
  "terms",
  "contact",
  "timetable",
  "pricing",
  "about",
  "book",
  "export",
  "_next",
  "activities",
  "courts",
  "locations",
]);

export default function ActivityDetailsClient({
  tenantSlug,
  lang,
  currency,
  date,
  activity,
}: {
  tenantSlug?: string;
  lang: string;
  currency: string;
  date: string;
  activity: ActivityDetails;
}) {
  const [t, setT] = useState<TFn>(() => (key: string) => key);
  const [derivedTenantSlug, setDerivedTenantSlug] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (tenantSlug) return;

    try {
      const path = window.location.pathname || "";
      const segs = path.split("/").filter(Boolean);
      const first = segs[0];
      if (first && !RESERVED.has(first)) {
        setDerivedTenantSlug(first);
      }
    } catch {}
  }, [tenantSlug]);

  const effectiveTenantSlug = tenantSlug || derivedTenantSlug;

  const base = useMemo(
    () => (effectiveTenantSlug ? `/${effectiveTenantSlug}` : ""),
    [effectiveTenantSlug]
  );

  const tenantHref = (path: string) =>
    path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tt = await getT(lang);
        if (alive) setT(() => tt as TFn);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  const price =
    typeof activity.basePrice === "number"
      ? `${currency}${(activity.basePrice / 100).toFixed(2)}`
      : null;

  const bookingHref = `${tenantHref("/timetable")}?activityId=${activity.id}&date=${date}&partySize=1`;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b16]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[320px] sm:min-h-[420px]">
            {activity.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activity.coverImageUrl}
                alt={activity.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full min-h-[320px] place-items-center bg-white/[0.03] text-sm text-white/45 sm:min-h-[420px]">
                {t("activities.preview")}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

            <div className="absolute left-5 top-5 flex gap-2">
              <Link
                href={tenantHref("/activities")}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/12 bg-black/35 px-5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-black/45"
              >
                ← Back to activities
              </Link>
            </div>
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.07),transparent_32%)]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70">
                Premium watersport
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {activity.name}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-white/68 sm:text-base">
                {activity.description ||
                  "A premium watersports experience designed for guests who want something exciting, memorable, and easy to book."}
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {activity.durationMin ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
                    ⏱ {activity.durationMin} {t("activities.minutes")}
                  </span>
                ) : null}

                {activity.maxParty ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
                    👥 Up to {activity.maxParty} guests
                  </span>
                ) : null}

                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
                  📍 Club meeting point
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">
                    Good for
                  </div>
                  <div className="mt-1 text-sm font-medium text-white/88">
                    Beginners & casual guests
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">
                    Booking
                  </div>
                  <div className="mt-1 text-sm font-medium text-white/88">
                    Instant confirmation
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">
                    Focus
                  </div>
                  <div className="mt-1 text-sm font-medium text-white/88">
                    Safety first
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-lg font-semibold text-white">What to expect</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/66">
                  <li>• A smooth, simple booking process with clear availability.</li>
                  <li>• A premium seaside experience designed for fun and comfort.</li>
                  <li>• Clear meeting-point guidance before your session.</li>
                  <li>• Booking and cancellation subject to the club policy.</li>
                </ul>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  {price ? (
                    <>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                        Starting from
                      </div>
                      <div className="mt-1 text-3xl font-semibold text-white">
                        {price}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-white/58">
                      Pricing available during booking
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <Link
                    href={bookingHref}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-sm font-medium text-white shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
                  >
                    {t("activities.select")}
                  </Link>

                  <p className="text-xs text-white/45">
                    Cancellation subject to booking policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}