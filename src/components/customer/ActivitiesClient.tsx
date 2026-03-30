"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getT } from "@/components/I18nProvider";

type ActivityCard = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  durationMin: number | null;
  maxParty: number | null;
  basePrice: number | null; // cents
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

export default function ActivitiesClient({
  tenantSlug,
  lang,
  currency,
  date,
  activities,
}: {
  tenantSlug?: string;
  lang: string;
  currency: string;
  date: string;
  activities: ActivityCard[];
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

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes fadeUp {
  0% { opacity: 0; transform: translateY(10px) scale(.995); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.card-appear { animation: fadeUp .55s ease-out both; }

@media (prefers-reduced-motion: reduce) {
  .card-appear { animation: none !important; }
}
          `.trim(),
        }}
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b16] px-5 py-8 sm:px-7 md:px-8 md:py-10">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(900px 320px at 50% -10%, rgba(56,189,248,0.15), transparent 60%), radial-gradient(700px 260px at 85% 10%, rgba(236,72,153,0.10), transparent 55%)",
          }}
        />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/72 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.65)]" />
              Water experiences
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("activities.title")}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/64 sm:text-base">
              {t("activities.subtitle")}
            </p>
          </div>

          <Link
            href={tenantHref("/")}
            title={t("activities.backTitle")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/[0.08]"
          >
            <span aria-hidden>←</span>
            {t("activities.back")}
          </Link>
        </div>
      </section>

      <div className="mt-8 md:mt-10" />

      {activities.length === 0 && (
        <div className="rounded-2xl border border-[--color-border] bg-[--color-card] p-6 text-center text-sm text-muted-foreground">
          {t("activities.empty")}{" "}
          <Link href={tenantHref("/admin/activities")} className="underline">
            Admin → Activities
          </Link>
          .
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 md:gap-7">
        {activities.map((a, idx) => {
          const img = a.coverImageUrl ?? null;
          const price =
            typeof a.basePrice === "number"
              ? `${currency}${(a.basePrice / 100).toFixed(2)}`
              : null;

          const shortDescription =
            a.description && a.description.length > 130
              ? `${a.description.slice(0, 127)}...`
              : a.description;

          const bookingHref = `${tenantHref("/timetable")}?activityId=${a.id}&date=${date}&partySize=1`;
          const detailsHref = tenantHref(`/activities/${encodeURIComponent(a.slug || a.id)}`);

          const badge =
            (a.maxParty ?? 0) >= 6
              ? "Great for groups"
              : (a.durationMin ?? 0) >= 90
              ? "Premium experience"
              : "Popular";

          return (
            <article
              key={a.id}
              className="card-appear group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b16] transition duration-300 hover:-translate-y-0.5 hover:border-white/15"
              style={{
                animationDelay: `${0.04 * idx}s`,
                boxShadow:
                  "0 24px 70px -38px rgba(0,0,0,0.9), 0 18px 50px -34px rgba(59,130,246,0.20)",
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_1fr]">
                <div className="relative min-h-[260px] overflow-hidden sm:min-h-[320px]">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={a.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full min-h-[260px] place-items-center bg-white/[0.03] text-xs text-white/45 sm:min-h-[320px]">
                      {t("activities.preview")}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-black/10" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                      {badge}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                      Instant booking
                    </span>
                  </div>

                  {price && (
                    <div className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-right backdrop-blur-xl">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">
                        From
                      </div>
                      <div className="text-base font-semibold text-white sm:text-lg">
                        {price}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative flex flex-col p-5 sm:p-6 lg:p-7">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.07),transparent_32%)]" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-white">
                        {a.name}
                      </h2>

                      <p className="mt-3 text-sm leading-relaxed text-white/64 sm:text-[15px]">
                        {shortDescription ||
                          "A premium watersports experience designed for fun, energy, and unforgettable moments by the sea."}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      {a.durationMin ? (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
                          ⏱ {a.durationMin} {t("activities.minutes")}
                        </span>
                      ) : null}

                      {a.maxParty ? (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
                          👥 Up to {a.maxParty} guests
                        </span>
                      ) : null}

                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
                        📍 Club meeting point
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">
                          Good to know
                        </div>
                        <div className="mt-1 text-sm font-medium text-white/88">
                          Beginner friendly
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">
                          Booking
                        </div>
                        <div className="mt-1 text-sm font-medium text-white/88">
                          Instant confirmation
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">
                          Experience
                        </div>
                        <div className="mt-1 text-sm font-medium text-white/88">
                          Safety first
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        {price ? (
                          <>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                              Starting from
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-white">
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
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Link
                            href={detailsHref}
                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] px-5 text-sm font-medium text-white/90 transition hover:bg-white/[0.08]"
                          >
                            Learn more
                          </Link>

                          <Link
                            href={bookingHref}
                            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-sm font-medium text-white shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
                          >
                            {t("activities.select")}
                          </Link>
                        </div>

                        <p className="text-xs text-white/45">
                          Cancellation subject to booking policy
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}