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
@keyframes locRoutePulse {
  0%,100% { opacity: .25; stroke-dashoffset: 0; }
  50% { opacity: .65; stroke-dashoffset: -18; }
}
@keyframes locBoatMove {
  0%   { transform: translate(0px, 0px) rotate(-8deg); }
  20%  { transform: translate(34px, -8px) rotate(-4deg); }
  40%  { transform: translate(78px, 4px) rotate(2deg); }
  60%  { transform: translate(118px, -10px) rotate(-3deg); }
  80%  { transform: translate(168px, 0px) rotate(4deg); }
  100% { transform: translate(210px, -6px) rotate(0deg); }
}
@keyframes locPinFloatA {
  0%,100% { transform: translateY(0px) scale(1); opacity: .78; }
  50% { transform: translateY(-8px) scale(1.06); opacity: 1; }
}
@keyframes locPinFloatB {
  0%,100% { transform: translateY(0px) scale(1); opacity: .68; }
  50% { transform: translateY(6px) scale(1.04); opacity: .92; }
}
@keyframes locCompassSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes locCompassPulse {
  0%,100% { opacity: .22; transform: scale(1); }
  50% { opacity: .42; transform: scale(1.06); }
}
@keyframes locStarPulse {
  0%,100% { opacity: .35; transform: scale(1); }
  50% { opacity: .95; transform: scale(1.3); }
}
@keyframes locScan {
  0% { transform: translateX(-120%); opacity: 0; }
  20% { opacity: .12; }
  50% { opacity: .22; }
  100% { transform: translateX(140%); opacity: 0; }
}
@keyframes locGridDrift {
  0% { transform: translate(0,0); opacity: .08; }
  50% { transform: translate(8px,-6px); opacity: .12; }
  100% { transform: translate(0,0); opacity: .08; }
}
                `.trim(),
              }}
            />

            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
                maskImage:
                  "radial-gradient(circle at center, black 36%, transparent 92%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, black 36%, transparent 92%)",
                animation: "locGridDrift 14s ease-in-out infinite",
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 20% 60%, rgba(236,72,153,0.14) 0%, transparent 28%), radial-gradient(circle at 78% 42%, rgba(56,189,248,0.14) 0%, transparent 26%), radial-gradient(circle at 52% 48%, rgba(168,85,247,0.10) 0%, transparent 34%)",
              }}
            />

            <div className="absolute left-6 top-6">
              <div className="relative h-16 w-16">
                <div
                  className="absolute inset-0 rounded-full border border-white/10"
                  style={{ animation: "locCompassSpin 18s linear infinite" }}
                />
                <div
                  className="absolute inset-2 rounded-full border border-sky-300/20"
                  style={{ animation: "locCompassSpin 10s linear infinite reverse" }}
                />
                <div
                  className="absolute inset-0 rounded-full blur-xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 72%)",
                    animation: "locCompassPulse 4.8s ease-in-out infinite",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-white/60">
                  Nav
                </div>
              </div>
            </div>

            <svg
              viewBox="0 0 320 150"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M32,102 C74,70 98,70 130,82 C162,94 188,116 214,104 C242,92 258,70 292,78"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
                strokeDasharray="6 8"
              />
              <path
                d="M32,102 C74,70 98,70 130,82 C162,94 188,116 214,104 C242,92 258,70 292,78"
                fill="none"
                stroke="rgba(236,72,153,0.45)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray="10 10"
                style={{ animation: "locRoutePulse 6s linear infinite" }}
              />
            </svg>

            <div
              className="absolute left-[28px] top-[94px] h-4 w-4 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(236,72,153,0.95) 0%, rgba(236,72,153,0.45) 45%, transparent 78%)",
                boxShadow: "0 0 18px rgba(236,72,153,0.4)",
                animation: "locPinFloatA 4.2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute left-[144px] top-[76px] h-3.5 w-3.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(56,189,248,0.95) 0%, rgba(56,189,248,0.42) 45%, transparent 78%)",
                boxShadow: "0 0 16px rgba(56,189,248,0.35)",
                animation: "locPinFloatB 5.3s ease-in-out infinite",
              }}
            />
            <div
              className="absolute right-[26px] top-[70px] h-4.5 w-4.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(168,85,247,0.95) 0%, rgba(168,85,247,0.42) 45%, transparent 78%)",
                boxShadow: "0 0 18px rgba(168,85,247,0.35)",
                animation: "locPinFloatA 4.9s ease-in-out infinite",
              }}
            />

            <div
              className="absolute left-[34px] top-[92px] z-10"
              style={{ animation: "locBoatMove 11s ease-in-out infinite alternate" }}
            >
              <div className="relative">
                <div
                  className="absolute -inset-2 rounded-full blur-xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(56,189,248,0.12) 38%, transparent 78%)",
                  }}
                />
                <div className="relative text-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]">
                  ⛵
                </div>
              </div>
            </div>

            <div
              className="absolute inset-y-0 left-[-30%] w-[55%]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 20%, rgba(236,72,153,0.10) 50%, rgba(56,189,248,0.08) 72%, transparent 100%)",
                filter: "blur(10px)",
                animation: "locScan 8s ease-in-out infinite",
              }}
            />

            <div
              className="absolute left-[42%] top-[34%] h-1.5 w-1.5 rounded-full bg-white"
              style={{
                boxShadow: "0 0 14px rgba(255,255,255,0.5)",
                animation: "locStarPulse 3.4s ease-in-out infinite",
              }}
            />
            <div
              className="absolute left-[62%] top-[64%] h-1.5 w-1.5 rounded-full bg-white"
              style={{
                boxShadow: "0 0 14px rgba(255,255,255,0.45)",
                animation: "locStarPulse 4.1s ease-in-out infinite",
              }}
            />
            <div
              className="absolute left-[74%] top-[30%] h-1 w-1 rounded-full bg-white"
              style={{
                boxShadow: "0 0 12px rgba(255,255,255,0.4)",
                animation: "locStarPulse 3.8s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}