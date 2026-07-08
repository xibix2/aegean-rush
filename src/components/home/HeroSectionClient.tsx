// src/components/home/HeroSectionClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Car,
  MapPin,
  Percent,
  ShieldCheck,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { useT } from "@/components/I18nProvider";

type HeroSectionClientProps = {
  tenantSlug: string;
  badgeText?: string | null;
  title?: string | null;
  highlightTitle?: string | null;
  subtitle?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  microText?: string | null;
};

type OfferSlide = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  imageAlt: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  stats: Array<{ label: string; value: string }>;
};

const poseidonBoatImage =
  "https://q8tnxmhsl7hrrlbk.public.blob.vercel-storage.com/activity_1777363730017_x8hligygcfh.jpeg";
const poseidonJetBoatImage =
  "https://q8tnxmhsl7hrrlbk.public.blob.vercel-storage.com/activity_1777024372610_q8ybtkawg9i.jpg";

const paradiseJetSkiImage =
  "https://q8tnxmhsl7hrrlbk.public.blob.vercel-storage.com/activity_1776415404029_aljeobsrpon.jpg";
const paradiseParasailingImage =
  "https://q8tnxmhsl7hrrlbk.public.blob.vercel-storage.com/activity_1776270849596_y1vk9n6flxl.jpg";
const paradiseSofaImage =
  "https://q8tnxmhsl7hrrlbk.public.blob.vercel-storage.com/activity_1776415981738_g4u2t5dsem.jpg";

function tenantHref(base: string, path: string) {
  return `${base}${path}`;
}

function getSlides(args: {
  tenantSlug: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}): OfferSlide[] {
  const { tenantSlug, primaryLabel, primaryHref, secondaryLabel, secondaryHref } =
    args;
  const base = `/${tenantSlug}`;

  if (tenantSlug === "poseidon-rent-a-boat") {
    return [
      {
        eyebrow: "Free hotel transfer",
        title: "Pickup and return",
        highlight: "included",
        subtitle:
          "We can collect guests from their hotel and bring them back after the activity, making the booking feel easy before they even arrive.",
        badge: "Best travel perk",
        imageUrl: poseidonBoatImage,
        imageAlt: "Boat rental in clear blue water near Hersonissos",
        primaryLabel: "See activities",
        primaryHref: tenantHref(base, "/activities"),
        secondaryLabel: "Contact us",
        secondaryHref: tenantHref(base, "/contact"),
        stats: [
          { label: "Hotel pickup", value: "Free" },
          { label: "Return ride", value: "Included" },
          { label: "Checkout", value: "Online" },
        ],
      },
      {
        eyebrow: "Limited-time offer",
        title: "Jet Boat Adventure",
        highlight: "EUR 45",
        subtitle:
          "Usually EUR 60 for adults. Book the 60-minute Jet Boat online and lock in the summer price before arriving.",
        badge: "Save EUR 15",
        imageUrl: poseidonJetBoatImage,
        imageAlt: "Jet Boat activity in Hersonissos",
        primaryLabel: "Book Jet Boat",
        primaryHref: tenantHref(base, "/activities/jet-boat"),
        secondaryLabel: "View all offers",
        secondaryHref: tenantHref(base, "/activities"),
        stats: [
          { label: "Adult ticket", value: "EUR 45" },
          { label: "Usually", value: "EUR 60" },
          { label: "Group deal", value: "6+1 free" },
        ],
      },
      {
        eyebrow: "Group deal",
        title: "Jet Boat 6+1",
        highlight: "free adult",
        subtitle:
          "Bring the group together: book six adult tickets for the Jet Boat and the seventh adult comes free.",
        badge: "Made for groups",
        imageUrl: poseidonJetBoatImage,
        imageAlt: "Group-friendly Jet Boat ride in Crete",
        primaryLabel: "Plan group ride",
        primaryHref: tenantHref(base, "/activities/jet-boat"),
        secondaryLabel: "Ask a question",
        secondaryHref: tenantHref(base, "/contact"),
        stats: [
          { label: "Adults", value: "6+1" },
          { label: "Transfer", value: "Free" },
          { label: "Confirm", value: "Instant" },
        ],
      },
      {
        eyebrow: "Private boat day",
        title: "Boat Rental",
        highlight: "from EUR 100",
        subtitle:
          "Take the boat out with your group and keep the day flexible. Online booking makes the plan simple.",
        badge: "Most flexible",
        imageUrl: poseidonBoatImage,
        imageAlt: "Poseidon boat rental on clear water",
        primaryLabel: "Book boat rental",
        primaryHref: tenantHref(base, "/activities/boat-rental-up-to-8-people"),
        secondaryLabel: "See activities",
        secondaryHref: tenantHref(base, "/activities"),
        stats: [
          { label: "From", value: "EUR 100" },
          { label: "Transfer", value: "Free" },
          { label: "Best for", value: "Groups" },
        ],
      },
    ];
  }

  if (tenantSlug === "paradisewatersports") {
    return [
      {
        eyebrow: "Free hotel transfer",
        title: "Arrive the easy way",
        highlight: "taxi included",
        subtitle:
          "Hotel pickup and return support removes the biggest booking friction for guests on holiday.",
        badge: "Easy from hotel",
        imageUrl: paradiseJetSkiImage,
        imageAlt: "Jet Ski activity at Paradise Watersports",
        primaryLabel: "See activities",
        primaryHref: tenantHref(base, "/activities"),
        secondaryLabel: "Contact us",
        secondaryHref: tenantHref(base, "/contact"),
        stats: [
          { label: "Pickup", value: "Free" },
          { label: "Return", value: "Included" },
          { label: "Book", value: "Online" },
        ],
      },
      {
        eyebrow: "Big summer discount",
        title: "20-minute Jet Ski",
        highlight: "offer ride",
        subtitle:
          "A short, exciting ride is one of the easiest holiday decisions. Reserve a Jet Ski slot online before arriving.",
        badge: "Fast decision",
        imageUrl: paradiseJetSkiImage,
        imageAlt: "Jet Ski ride in Crete",
        primaryLabel: "Book Jet Ski",
        primaryHref: tenantHref(base, "/activities/jet-ski"),
        secondaryLabel: "View all offers",
        secondaryHref: tenantHref(base, "/activities"),
        stats: [
          { label: "Duration", value: "20 min" },
          { label: "Transfer", value: "Free" },
          { label: "Confirm", value: "Instant" },
        ],
      },
      {
        eyebrow: "Couples offer",
        title: "Parasailing for two",
        highlight: "EUR 95",
        subtitle:
          "A strong couple-friendly offer: two people, one memorable flight, and simple hotel transfer support.",
        badge: "Couple favorite",
        imageUrl: paradiseParasailingImage,
        imageAlt: "Parasailing activity in Hersonissos",
        primaryLabel: "Book Parasailing",
        primaryHref: tenantHref(base, "/activities/parasailing"),
        secondaryLabel: "Ask a question",
        secondaryHref: tenantHref(base, "/contact"),
        stats: [
          { label: "For two", value: "EUR 95" },
          { label: "Pickup", value: "Free" },
          { label: "Best for", value: "Couples" },
        ],
      },
      {
        eyebrow: "Group fun",
        title: "Crazy Sofa Ride",
        highlight: "from EUR 20",
        subtitle:
          "A fun, shareable ride for friends and families. Make the minimum group size clear and turn it into a group activity.",
        badge: "Friends and family",
        imageUrl: paradiseSofaImage,
        imageAlt: "Crazy Sofa ride at Paradise Watersports",
        primaryLabel: "Book Sofa Ride",
        primaryHref: tenantHref(base, "/activities/crazy-sofa-ride"),
        secondaryLabel: "See activities",
        secondaryHref: tenantHref(base, "/activities"),
        stats: [
          { label: "From", value: "EUR 20" },
          { label: "Minimum", value: "2 guests" },
          { label: "Transfer", value: "Free" },
        ],
      },
    ];
  }

  return [
    {
      eyebrow: "Book before you arrive",
      title: "Skip the queue",
      highlight: "online",
      subtitle:
        "Reserve your activity online before you arrive. No waiting in line. No uncertainty. Just arrive and enjoy the water.",
      badge: "Instant confirmation",
      imageUrl: poseidonBoatImage,
      imageAlt: "Watersports activity in Crete",
      primaryLabel,
      primaryHref,
      secondaryLabel,
      secondaryHref,
      stats: [
        { label: "Availability", value: "Live" },
        { label: "Payment", value: "Secure" },
        { label: "Confirm", value: "Instant" },
      ],
    },
  ];
}

export function HeroSectionClient({
  tenantSlug,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: HeroSectionClientProps) {
  const t = useT();

  const base = `/${tenantSlug}`;
  const defaultActivitiesHref = `${base}/activities`;

  const resolvedPrimaryCtaLabel = primaryCtaLabel || "View activities";
  const resolvedPrimaryCtaHref = primaryCtaHref || defaultActivitiesHref;
  const resolvedSecondaryCtaLabel = secondaryCtaLabel || "Find our location";
  const resolvedSecondaryCtaHref = secondaryCtaHref || "#meeting-point";

  const slides = useMemo(
    () =>
      getSlides({
        tenantSlug,
        primaryLabel: resolvedPrimaryCtaLabel,
        primaryHref: resolvedPrimaryCtaHref,
        secondaryLabel: resolvedSecondaryCtaLabel,
        secondaryHref: resolvedSecondaryCtaHref,
      }),
    [
      tenantSlug,
      resolvedPrimaryCtaLabel,
      resolvedPrimaryCtaHref,
      resolvedSecondaryCtaLabel,
      resolvedSecondaryCtaHref,
    ],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [tenantSlug]);

  return (
    <section className="relative min-h-[calc(100svh-7rem)] overflow-hidden rounded-3xl border border-white/10 bg-[#050816] text-white shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)] sm:rounded-[2rem]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes heroShimmer {
  0% { transform: translateX(-120%) }
  100% { transform: translateX(120%) }
}
@media (prefers-reduced-motion: reduce), (max-width: 768px) {
  .hero-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.96)_0%,rgba(3,7,18,0.78)_42%,rgba(3,7,18,0.38)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#03050d] via-[#03050d]/45 to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100svh-7rem)] flex-col justify-between px-5 py-6 sm:px-8 md:px-10 md:py-8">
        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 py-10 md:grid-cols-[minmax(0,1fr)_380px] md:py-16">
          <div className="max-w-3xl text-center md:text-left">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-pink-300/25 bg-pink-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-pink-50 backdrop-blur sm:text-xs">
              {activeIndex === 0 ? (
                <Car className="size-3.5 shrink-0" />
              ) : activeSlide.eyebrow.toLowerCase().includes("offer") ||
                activeSlide.eyebrow.toLowerCase().includes("deal") ? (
                <Percent className="size-3.5 shrink-0" />
              ) : (
                <Sparkles className="size-3.5 shrink-0" />
              )}
              <span className="truncate">{activeSlide.eyebrow}</span>
            </div>

            <h1 className="text-[2.85rem] font-black uppercase leading-[0.9] text-white sm:text-6xl md:text-7xl">
              {activeSlide.title}
              <span className="block bg-gradient-to-r from-pink-300 via-fuchsia-200 to-cyan-100 bg-clip-text text-transparent">
                {activeSlide.highlight}
              </span>
            </h1>

            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-200/25 bg-cyan-300/15 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-cyan-50 shadow-[0_14px_45px_-24px_rgba(34,211,238,0.9)]">
              <Sparkles className="size-4" />
              {activeSlide.badge}
            </div>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/78 md:mx-0 md:text-lg">
              {activeSlide.subtitle}
            </p>

            <div className="mt-7 grid gap-2.5 sm:flex md:justify-start">
              <Link
                href={activeSlide.primaryHref}
                className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-7 text-sm font-bold text-white shadow-[0_18px_55px_-18px_rgba(236,72,153,0.9)] transition hover:scale-[1.03]"
              >
                <span
                  className="hero-anim absolute inset-0 opacity-40"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                    animation: "heroShimmer 3.8s linear infinite",
                  }}
                />
                <Waves className="relative mr-2 size-4" />
                <span className="relative">{activeSlide.primaryLabel}</span>
              </Link>

              <a
                href={activeSlide.secondaryHref}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.08] px-7 text-sm font-bold text-white/88 transition hover:bg-white/12"
              >
                <MapPin className="mr-2 size-4" />
                {activeSlide.secondaryLabel}
              </a>
            </div>

            <div className="mt-8 grid gap-2 sm:grid-cols-3">
              {activeSlide.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/12 bg-black/28 px-4 py-3 backdrop-blur"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/46">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-lg font-black text-white">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden rounded-[1.75rem] border border-white/12 bg-black/30 p-4 shadow-[0_28px_90px_-45px_rgba(0,0,0,0.95)] backdrop-blur-xl md:block">
            <div
              className="aspect-[4/5] rounded-[1.35rem] bg-cover bg-center"
              style={{ backgroundImage: `url(${activeSlide.imageUrl})` }}
              role="img"
              aria-label={activeSlide.imageAlt}
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] text-white/84 backdrop-blur-xl sm:px-3.5 sm:text-xs">
              <Car className="size-3.5 text-cyan-300" />
              Free hotel transfer
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] text-white/84 backdrop-blur-xl sm:px-3.5 sm:text-xs">
              <ShieldCheck className="size-3.5 text-pink-300" />
              {t("home.trust.secureCheckout")}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] text-white/84 backdrop-blur-xl sm:px-3.5 sm:text-xs">
              <CalendarDays className="size-3.5 text-cyan-200" />
              {t("home.trust.realTime")}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] text-white/84 backdrop-blur-xl sm:px-3.5 sm:text-xs">
              <Zap className="size-3.5 text-cyan-200" />
              Instant confirmation
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Show offer ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-8 bg-cyan-200"
                    : "w-2.5 bg-white/35 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
