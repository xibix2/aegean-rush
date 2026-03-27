"use client";

import {
  MapPin,
  Navigation,
  Clock3,
  Phone,
  Sparkles,
  Waves,
} from "lucide-react";

type LocationSectionClientProps = {
  clubSlug: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  badgeText?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  locationName?: string | null;
  addressLine?: string | null;
  googleMapsUrl?: string | null;
  embedUrl?: string | null;
  detailLine1?: string | null;
  detailLine2?: string | null;
  detailLine3?: string | null;
};

function isValidGoogleMapsEmbedUrl(value: string | null | undefined) {
  if (!value) return false;

  const trimmed = value.trim();

  return (
    trimmed.startsWith("https://www.google.com/maps/embed?") ||
    trimmed.startsWith("https://maps.google.com/maps?") ||
    trimmed.startsWith("https://www.google.com/maps?q=")
  );
}

export function LocationSectionClient({
  clubSlug,
  title,
  subtitle,
  body,
  badgeText,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  locationName,
  addressLine,
  googleMapsUrl,
  embedUrl,
  detailLine1,
  detailLine2,
  detailLine3,
}: LocationSectionClientProps) {
  const resolvedTitle = title || "Find your meeting point";
  const resolvedSubtitle =
    subtitle ||
    "Everything guests need to find you easily, arrive with confidence, and feel ready before the experience starts.";

  const resolvedLocationName = locationName || "Main meeting point";
  const resolvedAddressLine =
    addressLine || "Set your exact address in the homepage editor.";

  const resolvedGoogleMapsUrl =
    googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      resolvedAddressLine
    )}`;

  const resolvedPrimaryCtaLabel = primaryCtaLabel || "Open in Google Maps";
  const resolvedPrimaryCtaHref = primaryCtaHref || resolvedGoogleMapsUrl;
  const resolvedSecondaryCtaLabel = secondaryCtaLabel || "Contact us";
  const resolvedSecondaryCtaHref =
    secondaryCtaHref || `/${clubSlug}/contact`;

  const detailItems = [
    detailLine1 || "Arrive 15 minutes before your booking.",
    detailLine2 || "Easy access and clear meeting instructions.",
    detailLine3 || "Contact the club if you need help finding the spot.",
  ].filter(Boolean);

  const safeEmbedUrl = isValidGoogleMapsEmbedUrl(embedUrl)
    ? embedUrl!.trim()
    : null;

  return (
    <section
      id="meeting-point"
      className="scroll-mt-28 md:scroll-mt-36 relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#070b16] px-5 py-12 backdrop-blur-xl sm:px-6 md:px-8 md:py-16"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes locGlowMain {
  0%,100% { opacity: .22; transform: scale(1) translateY(0px); }
  50% { opacity: .4; transform: scale(1.05) translateY(-8px); }
}
@keyframes locGlowFloat {
  0%,100% { opacity: .14; transform: translateY(0px); }
  50% { opacity: .24; transform: translateY(-12px); }
}
@keyframes locCardIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes locPulse {
  0%,100% { transform: scale(1); opacity: .9; }
  50% { transform: scale(1.08); opacity: 1; }
}
@keyframes locOrbA {
  0%,100% { transform: translate3d(0,0,0) scale(1); opacity: .55; }
  50% { transform: translate3d(12px,-10px,0) scale(1.08); opacity: .9; }
}
@keyframes locOrbB {
  0%,100% { transform: translate3d(0,0,0) scale(1); opacity: .45; }
  50% { transform: translate3d(-10px,8px,0) scale(1.12); opacity: .8; }
}
@keyframes locBeam {
  0%,100% { opacity: .18; transform: translateX(-6px); }
  50% { opacity: .34; transform: translateX(10px); }
}
@keyframes locGrid {
  0% { transform: translate(0,0); }
  50% { transform: translate(8px,-6px); }
  100% { transform: translate(0,0); }
}
@media (prefers-reduced-motion: reduce) {
  .loc-anim,
  .loc-card {
    animation: none !important;
    transition: none !important;
  }
}
          `.trim(),
        }}
      />

      <div
        className="loc-anim pointer-events-none absolute left-1/2 top-0 h-56 w-[74%] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(236,72,153,0.14) 38%, rgba(168,85,247,0.16) 58%, transparent 76%)",
          animation: "locGlowMain 9s ease-in-out infinite",
        }}
      />
      <div
        className="loc-anim pointer-events-none absolute left-[4%] top-[18%] h-40 w-40 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 72%)",
          animation: "locGlowFloat 11s ease-in-out infinite",
        }}
      />
      <div
        className="loc-anim pointer-events-none absolute right-[6%] bottom-[10%] h-44 w-44 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 72%)",
          animation: "locGlowFloat 13s ease-in-out infinite",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
        <div
          className="loc-card rounded-[1.9rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_28px_90px_-55px_rgba(0,0,0,0.95)]"
          style={{
            animation: "locCardIn 700ms cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/72 backdrop-blur-xl">
            <Sparkles className="size-3.5 text-sky-300" />
            {badgeText || "Meeting point"}
          </div>

          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {title || "Meeting point"}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/68 md:text-base">
            {resolvedSubtitle}
          </p>

          <div className="mt-7 rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/90 backdrop-blur-xl">
                <MapPin className="size-5 text-pink-300" />
              </div>

              <div className="min-w-0">
                <p className="text-sm uppercase tracking-[0.18em] text-white/42">
                  Location
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  {resolvedLocationName}
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {detailItems.map((detail, index) => (
                <div
                  key={`${detail}-${index}`}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  {index === 0 ? (
                    <Clock3 className="mt-0.5 size-4 shrink-0 text-sky-300" />
                  ) : index === 1 ? (
                    <Waves className="mt-0.5 size-4 shrink-0 text-fuchsia-300" />
                  ) : (
                    <Phone className="mt-0.5 size-4 shrink-0 text-pink-300" />
                  )}
                  <p className="text-sm leading-relaxed text-white/64">
                    {detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={resolvedPrimaryCtaHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-sm font-medium text-white shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
              >
                <Navigation className="size-4" />
                {resolvedPrimaryCtaLabel}
              </a>

              <a
                href={resolvedSecondaryCtaHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white/88 transition hover:bg-white/[0.08]"
              >
                <Waves className="size-4 text-sky-300" />
                {resolvedSecondaryCtaLabel}
              </a>
            </div>
          </div>
        </div>

        <div
          className="loc-card relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.05] p-3 shadow-[0_28px_90px_-55px_rgba(0,0,0,0.95)]"
          style={{
            animation:
              "locCardIn 700ms cubic-bezier(0.22,1,0.36,1) 120ms both",
          }}
        >
          <div className="pointer-events-none absolute right-6 top-6 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/75 backdrop-blur-xl">
            <div
              className="h-2.5 w-2.5 rounded-full bg-pink-400"
              style={{ animation: "locPulse 2.4s ease-in-out infinite" }}
            />
            Live map
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
            {safeEmbedUrl ? (
              <iframe
                src={safeEmbedUrl}
                title="Meeting point map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[340px] w-full"
              />
            ) : (
              <div className="flex h-[340px] flex-col items-center justify-center px-6 text-center">
                <MapPin className="size-10 text-pink-300" />
                <h3 className="mt-4 text-xl font-semibold text-white">
                  Add a valid Google Maps embed URL
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/58">
                  Paste a Google Maps embed link in the homepage admin editor.
                </p>
                <a
                  href={resolvedGoogleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-5 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
                >
                  <Navigation className="size-4 text-sky-300" />
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>

          <div className="relative mt-4 h-[150px] overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20">
            <style
              dangerouslySetInnerHTML={{
                __html: `
@keyframes locCorePulse {
  0%,100% { transform: translate(-50%, -50%) scale(1); opacity: .82; }
  50% { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
}
@keyframes locRingRotateA {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes locRingRotateB {
  from { transform: translate(-50%, -50%) rotate(360deg); }
  to { transform: translate(-50%, -50%) rotate(0deg); }
}
@keyframes locParticleA {
  0%,100% { transform: translate3d(0,0,0) scale(1); opacity: .55; }
  50% { transform: translate3d(18px,-12px,0) scale(1.16); opacity: .95; }
}
@keyframes locParticleB {
  0%,100% { transform: translate3d(0,0,0) scale(1); opacity: .5; }
  50% { transform: translate3d(-16px,12px,0) scale(1.1); opacity: .85; }
}
@keyframes locBeamSweep {
  0% { transform: translateX(-30%) skewX(-18deg); opacity: 0; }
  20% { opacity: .18; }
  50% { opacity: .34; }
  100% { transform: translateX(30%) skewX(-18deg); opacity: 0; }
}
@keyframes locNebula {
  0%,100% { transform: scale(1) translateY(0px); opacity: .3; }
  50% { transform: scale(1.08) translateY(-8px); opacity: .5; }
}
@keyframes locGridDrift {
  0% { transform: translate(0,0); opacity: .07; }
  50% { transform: translate(10px,-8px); opacity: .11; }
  100% { transform: translate(0,0); opacity: .07; }
}
                `.trim(),
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 55%, rgba(236,72,153,0.12) 0%, rgba(168,85,247,0.10) 26%, rgba(56,189,248,0.10) 44%, transparent 72%)",
                animation: "locNebula 10s ease-in-out infinite",
              }}
            />

            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
                maskImage:
                  "radial-gradient(circle at center, black 30%, transparent 88%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, black 30%, transparent 88%)",
                animation: "locGridDrift 16s ease-in-out infinite",
              }}
            />

            <div
              className="absolute left-1/2 top-1/2 h-[150px] w-[150px] rounded-full border border-white/10"
              style={{
                animation: "locRingRotateA 18s linear infinite",
                boxShadow: "0 0 50px rgba(236,72,153,0.08)",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-[108px] w-[108px] rounded-full border border-white/10"
              style={{
                animation: "locRingRotateB 14s linear infinite",
                boxShadow: "0 0 40px rgba(56,189,248,0.08)",
              }}
            />

            <div
              className="absolute left-1/2 top-1/2 h-16 w-16 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(236,72,153,0.45) 0%, rgba(168,85,247,0.28) 42%, transparent 78%)",
                animation: "locCorePulse 6s ease-in-out infinite",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-9 w-9 rounded-full"
              style={{
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(56,189,248,0.4) 45%, rgba(236,72,153,0.18) 72%, transparent 100%)",
                boxShadow:
                  "0 0 30px rgba(255,255,255,0.18), 0 0 60px rgba(236,72,153,0.16), 0 0 80px rgba(56,189,248,0.14)",
              }}
            />

            <div
              className="absolute left-[16%] top-[28%] h-20 w-20 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(236,72,153,0.34) 0%, transparent 72%)",
                animation: "locParticleA 9s ease-in-out infinite",
              }}
            />
            <div
              className="absolute right-[14%] top-[24%] h-24 w-24 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(56,189,248,0.30) 0%, transparent 72%)",
                animation: "locParticleB 11s ease-in-out infinite",
              }}
            />
            <div
              className="absolute left-[32%] bottom-[14%] h-16 w-16 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(168,85,247,0.30) 0%, transparent 72%)",
                animation: "locParticleA 10s ease-in-out infinite",
              }}
            />
            <div
              className="absolute right-[28%] bottom-[16%] h-14 w-14 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 72%)",
                animation: "locParticleB 8s ease-in-out infinite",
              }}
            />

            <div
              className="absolute inset-y-0 left-[-20%] w-[70%]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(236,72,153,0.06) 38%, rgba(255,255,255,0.1) 50%, rgba(56,189,248,0.08) 62%, transparent 100%)",
                filter: "blur(8px)",
                animation: "locBeamSweep 7s ease-in-out infinite",
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/62 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                Energy pulse
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}