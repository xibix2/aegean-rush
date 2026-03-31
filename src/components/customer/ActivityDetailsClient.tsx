"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getT } from "@/components/I18nProvider";

type ActivityDurationOption = {
  id: string;
  label: string | null;
  durationMin: number;
  priceCents: number;
};

type ActivityDetails = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  durationMin: number;
  minParty: number;
  maxParty: number;
  basePrice: number | null;
  requiresInstructor: boolean;
  locationId: string;
  coverImageUrl: string | null;
  mode: "FIXED_SEAT_EVENT" | "DYNAMIC_RENTAL" | "HYBRID_UNIT_BOOKING";
  meetingPoint: string | null;
  includedText: string | null;
  bringText: string | null;
  cancellationText: string | null;
  ageInfo: string | null;
  skillLevel: string | null;
  safetyInfo: string | null;
  pricingNotes: string | null;
  guestsPerUnit: number | null;
  maxUnitsPerBooking: number | null;
  slotIntervalMin: number | null;
  durationOptions: ActivityDurationOption[];
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

function splitLines(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/\n|•|-/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatMoney(currency: string, cents: number | null | undefined) {
  if (typeof cents !== "number") return null;
  return `${currency}${(cents / 100).toFixed(2)}`;
}

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

  const bookingHref = `${tenantHref("/timetable")}?activityId=${activity.id}&date=${date}&partySize=1`;
  const basePrice = formatMoney(currency, activity.basePrice);

  const includedItems = splitLines(activity.includedText);
  const bringItems = splitLines(activity.bringText);

  const overviewItems: string[] = [];

  if (activity.durationMin) {
    overviewItems.push(`${activity.durationMin} ${t("activities.minutes")}`);
  }

  if (activity.mode === "FIXED_SEAT_EVENT") {
    overviewItems.push(`${activity.minParty}-${activity.maxParty} guests`);
  }

  if (activity.mode === "DYNAMIC_RENTAL") {
    if (activity.maxUnitsPerBooking) {
      overviewItems.push(`Up to ${activity.maxUnitsPerBooking} units per booking`);
    }
    if (activity.slotIntervalMin) {
      overviewItems.push(`${activity.slotIntervalMin} min booking interval`);
    }
  }

  if (activity.mode === "HYBRID_UNIT_BOOKING") {
    if (activity.guestsPerUnit) {
      overviewItems.push(`${activity.guestsPerUnit} guests per unit`);
    }
    if (activity.maxUnitsPerBooking) {
      overviewItems.push(`Up to ${activity.maxUnitsPerBooking} units per booking`);
    }
  }

  if (activity.skillLevel) {
    overviewItems.push(activity.skillLevel);
  }

  const infoCards = [
    activity.meetingPoint
      ? { title: "Meeting point", body: activity.meetingPoint }
      : null,
    activity.ageInfo
      ? { title: "Age info", body: activity.ageInfo }
      : null,
    activity.safetyInfo
      ? { title: "Safety", body: activity.safetyInfo }
      : null,
    activity.cancellationText
      ? { title: "Cancellation", body: activity.cancellationText }
      : null,
  ].filter(Boolean) as { title: string; body: string }[];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b16]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
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

            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <Link
                href={tenantHref("/activities")}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/12 bg-black/35 px-5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-black/45"
              >
                ← Back to activities
              </Link>

              <span className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/12 bg-black/35 px-5 text-sm font-medium text-white/80 backdrop-blur">
                {activity.mode === "FIXED_SEAT_EVENT"
                  ? "Experience"
                  : activity.mode === "DYNAMIC_RENTAL"
                  ? "Rental"
                  : "Hybrid booking"}
              </span>
            </div>
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.07),transparent_32%)]" />

            <div className="relative z-10">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {activity.name}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-white/68 sm:text-base">
                {activity.description ||
                  "A premium watersports experience designed for guests who want something memorable, exciting, and easy to book."}
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {overviewItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78"
                  >
                    {item}
                  </span>
                ))}

                {activity.requiresInstructor && (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
                    Instructor required
                  </span>
                )}
              </div>

              {activity.durationOptions.length > 0 && (
                <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                  <h2 className="text-lg font-semibold text-white">
                    Duration & pricing options
                  </h2>

                  <div className="mt-4 grid gap-3">
                    {activity.durationOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-white/90">
                            {opt.label || `${opt.durationMin} ${t("activities.minutes")}`}
                          </div>
                          <div className="text-xs text-white/50">
                            {opt.durationMin} {t("activities.minutes")}
                          </div>
                        </div>

                        <div className="text-sm font-semibold text-white">
                          {formatMoney(currency, opt.priceCents)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {basePrice && activity.durationOptions.length === 0 && (
                <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                    Starting from
                  </div>
                  <div className="mt-1 text-3xl font-semibold text-white">
                    {basePrice}
                  </div>
                  {activity.pricingNotes && (
                    <p className="mt-3 text-sm leading-relaxed text-white/60">
                      {activity.pricingNotes}
                    </p>
                  )}
                </div>
              )}

              {!basePrice && activity.pricingNotes && (
                <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                  <h2 className="text-lg font-semibold text-white">Pricing notes</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {activity.pricingNotes}
                  </p>
                </div>
              )}

              {includedItems.length > 0 && (
                <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                  <h2 className="text-lg font-semibold text-white">What’s included</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/66">
                    {includedItems.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bringItems.length > 0 && (
                <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                  <h2 className="text-lg font-semibold text-white">What to bring</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/66">
                    {bringItems.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {infoCards.length > 0 && (
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {infoCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.6rem] border border-white/10 bg-[#070b16] p-5"
            >
              <h2 className="text-lg font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/66">
                {card.body}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="mt-8 rounded-[1.8rem] border border-white/10 bg-[#070b16] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Ready to book this activity?
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Check live availability and choose the best time for your booking.
            </p>
          </div>

          <Link
            href={bookingHref}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-sm font-medium text-white shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
          >
            {t("activities.select")}
          </Link>
        </div>
      </section>
    </main>
  );
}