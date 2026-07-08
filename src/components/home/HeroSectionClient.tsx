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
  tabLabel: string;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  badge: string;
  oldPrice?: string;
  newPrice?: string;
  priceNote?: string;
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
        tabLabel: "Transfer",
        eyebrow: "Free hotel transfer",
        title: "Pickup and return",
        highlight: "free",
        subtitle:
          "We can collect guests from their hotel and bring them back after the activity. Less planning, less stress, more bookings.",
        badge: "Free taxi transfer",
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
        tabLabel: "No queue",
        eyebrow: "Book before you arrive",
        title: "Don't wait",
        highlight: "in line",
        subtitle:
          "Reserve your activity online, see real availability, pay securely, and arrive ready for the water.",
        badge: "Skip the desk",
        imageUrl: poseidonJetBoatImage,
        imageAlt: "Guests enjoying a Jet Boat activity",
        primaryLabel: "Book online",
        primaryHref: tenantHref(base, "/activities"),
        secondaryLabel: "See location",
        secondaryHref: "#meeting-point",
        stats: [
          { label: "Availability", value: "Live" },
          { label: "Checkout", value: "Secure" },
          { label: "Confirm", value: "Instant" },
        ],
      },
      {
        tabLabel: "Jet Boat",
        eyebrow: "Limited-time offer",
        title: "Jet Boat Adventure",
        highlight: "save EUR 15",
        subtitle:
          "The 60-minute Jet Boat adult ticket is usually EUR 60. Online summer price is now EUR 45.",
        badge: "Adult ticket deal",
        oldPrice: "EUR 60",
        newPrice: "EUR 45",
        priceNote: "online price",
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
        tabLabel: "6+1",
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
        tabLabel: "Boat",
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
        tabLabel: "Transfer",
        eyebrow: "Free hotel transfer",
        title: "Arrive the easy way",
        highlight: "free taxi",
        subtitle:
          "Hotel pickup and return support removes the biggest booking friction for guests on holiday.",
        badge: "Pickup and return",
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
        tabLabel: "No queue",
        eyebrow: "Book before you arrive",
        title: "Don't wait",
        highlight: "in line",
        subtitle:
          "Book online before you reach the beach. Your slot is reserved, checkout is secure, and confirmation is instant.",
        badge: "Skip the desk",
        imageUrl: paradiseJetSkiImage,
        imageAlt: "Paradise Watersports online booking",
        primaryLabel: "Book online",
        primaryHref: tenantHref(base, "/activities"),
        secondaryLabel: "Contact us",
        secondaryHref: tenantHref(base, "/contact"),
        stats: [
          { label: "Availability", value: "Live" },
          { label: "Payment", value: "Secure" },
          { label: "Confirm", value: "Instant" },
        ],
      },
      {
        tabLabel: "Jet Ski",
        eyebrow: "Big summer discount",
        title: "20-minute Jet Ski",
        highlight: "big offer",
        subtitle:
          "A short, exciting ride is one of the easiest holiday decisions. Make it feel like the deal they should grab today.",
        badge: "Summer discount",
        oldPrice: "High season price",
        newPrice: "20-min offer",
        priceNote: "limited slots",
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
        tabLabel: "Parasail",
        eyebrow: "Couples offer",
        title: "Parasailing for two",
        highlight: "EUR 95",
        subtitle:
          "A strong couple-friendly offer: two people, one memorable flight, and simple hotel transfer support.",
        badge: "Couple favorite",
        oldPrice: "Couple flight",
        newPrice: "EUR 95",
        priceNote: "for 2 people",
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
        tabLabel: "Sofa",
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
      tabLabel: "Online",
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

function OfferPriceGraphic({ slide }: { slide: OfferSlide }) {
  if (!slide.oldPrice && !slide.newPrice) return null;

  return (
    <div className="mx-auto mt-4 grid w-full max-w-[19rem] grid-cols-[1fr_auto_1.08fr] items-center gap-1.5 rounded-2xl border border-white/14 bg-black/38 p-2 shadow-[0_24px_70px_-38px_rgba(236,72,153,0.95)] backdrop-blur-xl sm:max-w-sm sm:gap-2 sm:rounded-3xl sm:p-3 md:mx-0 md:mt-5">
      <div className="rounded-xl border border-red-300/20 bg-red-500/12 px-2 py-2 text-center sm:rounded-2xl sm:px-3 sm:py-3">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-red-100/75">
          Before
        </div>
        <div className="relative mt-1 inline-block text-sm font-black text-white/70 sm:text-lg">
          {slide.oldPrice}
          <span className="absolute left-[-8%] top-1/2 h-1 w-[116%] -rotate-6 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.8)]" />
        </div>
      </div>

      <div className="text-sm font-black text-cyan-100 sm:text-xl">to</div>

      <div className="rounded-xl border border-cyan-200/25 bg-cyan-300 px-2 py-2 text-center text-[#06101c] shadow-[0_18px_45px_-24px_rgba(34,211,238,0.95)] sm:rounded-2xl sm:px-3 sm:py-3">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
          Now
        </div>
        <div className="mt-1 text-xl font-black leading-none sm:text-2xl">
          {slide.newPrice}
        </div>
        {slide.priceNote && (
          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-75">
            {slide.priceNote}
          </div>
        )}
      </div>
    </div>
  );
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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#050816] text-white shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)] sm:rounded-[2rem] md:min-h-[calc(100svh-7rem)]">
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

      <div className="relative z-10 flex min-h-[78svh] flex-col justify-between px-4 py-4 sm:px-8 md:min-h-[calc(100svh-7rem)] md:px-10 md:py-8">
        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-4 py-4 md:grid-cols-[minmax(0,1fr)_380px] md:gap-8 md:py-16">
          <div className="max-w-3xl text-center md:text-left">
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-pink-300/25 bg-pink-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-pink-50 backdrop-blur sm:text-xs md:mb-4">
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

            <h1 className="text-[clamp(2.35rem,13vw,4.25rem)] font-black uppercase leading-[0.88] text-white md:text-7xl">
              {activeSlide.title}
              <span className="block bg-gradient-to-r from-pink-300 via-fuchsia-200 to-cyan-100 bg-clip-text text-transparent">
                {activeSlide.highlight}
              </span>
            </h1>

            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-cyan-200/25 bg-cyan-300/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-50 shadow-[0_14px_45px_-24px_rgba(34,211,238,0.9)] sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles className="size-3.5 shrink-0 sm:size-4" />
              {activeSlide.badge}
            </div>

            <OfferPriceGraphic slide={activeSlide} />

            <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-5 text-white/80 sm:mt-4 sm:text-sm sm:leading-6 md:mx-0 md:mt-5 md:text-lg md:leading-7">
              {activeSlide.subtitle}
            </p>

            <div className="mt-4 grid gap-2.5 sm:flex md:mt-7 md:justify-start">
              <Link
                href={activeSlide.primaryHref}
                className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 text-[13px] font-bold text-white shadow-[0_18px_55px_-18px_rgba(236,72,153,0.9)] transition hover:scale-[1.03] sm:h-12 sm:rounded-2xl sm:px-7 sm:text-sm"
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
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.08] px-6 text-[13px] font-bold text-white/88 transition hover:bg-white/12 sm:h-12 sm:rounded-2xl sm:px-7 sm:text-sm"
              >
                <MapPin className="mr-2 size-4" />
                {activeSlide.secondaryLabel}
              </a>
            </div>

            <div className="mt-5 hidden grid-cols-3 gap-2 sm:grid md:mt-8">
              {activeSlide.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/12 bg-black/32 px-2 py-2 backdrop-blur md:px-4 md:py-3"
                >
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/46 md:text-[10px] md:tracking-[0.16em]">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-sm font-black text-white md:text-lg">
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

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between md:pt-5">
          <div className="hidden flex-wrap justify-center gap-2 md:flex md:justify-start">
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

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:justify-center md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Show ${slide.tabLabel}`}
                onClick={() => setActiveIndex(index)}
                className={`h-9 shrink-0 rounded-full border px-3 text-[11px] font-black uppercase tracking-[0.12em] transition-all sm:h-10 sm:text-xs ${
                  index === activeIndex
                    ? "border-cyan-200 bg-cyan-200 text-[#06101c]"
                    : "border-white/12 bg-white/8 text-white/72 hover:bg-white/14"
                }`}
              >
                {slide.tabLabel}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
