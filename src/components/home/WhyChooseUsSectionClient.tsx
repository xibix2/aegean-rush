// src/components/home/WhyChooseUsSectionClient.tsx
"use client";

import {
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Zap,
  Waves,
} from "lucide-react";

type WhyChooseUsItem = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
};

type WhyChooseUsSectionClientProps = {
  title?: string | null;
  subtitle?: string | null;
  items: WhyChooseUsItem[];
};

function getIcon(icon: string | null, index: number) {
  const value = (icon || "").toLowerCase();

  if (value.includes("calendar") || value.includes("availability")) {
    return CalendarDays;
  }
  if (value.includes("zap") || value.includes("instant") || value.includes("fast")) {
    return Zap;
  }
  if (value.includes("shield") || value.includes("secure") || value.includes("payment")) {
    return ShieldCheck;
  }
  if (value.includes("waves") || value.includes("premium") || value.includes("experience")) {
    return Waves;
  }

  if (index === 0) return CalendarDays;
  if (index === 1) return Zap;
  if (index === 2) return ShieldCheck;
  return Waves;
}

function getStepGlow(index: number) {
  if (index === 0) {
    return "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 72%)";
  }
  if (index === 1) {
    return "radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 72%)";
  }
  if (index === 2) {
    return "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 72%)";
  }
  return "radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 72%)";
}

export function WhyChooseUsSectionClient({
  title,
  subtitle,
  items,
}: WhyChooseUsSectionClientProps) {
  const resolvedItems =
    items.length > 0
      ? items
      : [
          {
            id: "1",
            title: "Real-time availability",
            description: "See exactly what is available before you commit.",
            icon: "calendar",
            sortOrder: 0,
          },
          {
            id: "2",
            title: "Instant booking",
            description: "Book your experience in seconds without back-and-forth.",
            icon: "zap",
            sortOrder: 1,
          },
          {
            id: "3",
            title: "Secure payments",
            description: "Pay confidently through a secure checkout flow.",
            icon: "shield",
            sortOrder: 2,
          },
          {
            id: "4",
            title: "Premium experiences",
            description: "Designed for clubs that want to look and feel exceptional.",
            icon: "waves",
            sortOrder: 3,
          },
        ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d14] px-4 py-9 backdrop-blur-xl sm:rounded-[2.1rem] sm:px-6 sm:py-12 md:px-8 md:py-14">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes wcuGlowA {
  0%,100% { opacity: .16; transform: scale(1); }
  50% { opacity: .3; transform: scale(1.05); }
}
@keyframes wcuGlowB {
  0%,100% { opacity: .12; transform: translateY(0px); }
  50% { opacity: .22; transform: translateY(-10px); }
}
@keyframes wcuCardIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes wcuShimmer {
  0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
  20% { opacity: .08; }
  50% { opacity: .14; }
  100% { transform: translateX(140%) skewX(-18deg); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .wcu-anim,
  .wcu-card {
    animation: none !important;
    transition: none !important;
  }
}
          `.trim(),
        }}
      />

      <div
        className="wcu-anim pointer-events-none absolute left-1/2 top-0 h-36 w-[90%] -translate-x-1/2 blur-3xl sm:h-44 sm:w-[68%]"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.14) 0%, rgba(56,189,248,0.10) 42%, transparent 72%)",
          animation: "wcuGlowA 8s ease-in-out infinite",
        }}
      />

      <div
        className="wcu-anim pointer-events-none absolute left-[4%] top-[20%] h-28 w-28 rounded-full blur-3xl sm:left-[10%] sm:h-36 sm:w-36"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 72%)",
          animation: "wcuGlowB 10s ease-in-out infinite",
        }}
      />

      <div
        className="wcu-anim pointer-events-none absolute right-[2%] bottom-[12%] h-32 w-32 rounded-full blur-3xl sm:right-[8%] sm:h-40 sm:w-40"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 72%)",
          animation: "wcuGlowB 12s ease-in-out infinite",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/70 backdrop-blur-xl sm:mb-4 sm:px-4 sm:text-xs sm:tracking-[0.18em]">
            <Sparkles className="size-3.5 text-pink-300" />
            Why choose us
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-5xl">
            {title || "Why guests book with confidence"}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:mt-4 md:text-base">
            {subtitle ||
              "A smoother booking experience, clearer availability, and a premium first impression from the very first click."}
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {resolvedItems.slice(0, 4).map((item, index) => {
            const Icon = getIcon(item.icon, index);

            return (
              <div
                key={item.id}
                className="wcu-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.055] sm:rounded-[1.75rem] sm:p-6"
                style={{
                  animation: `wcuCardIn 600ms cubic-bezier(0.22,1,0.36,1) ${index * 90}ms both`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-50 blur-2xl transition duration-500 group-hover:opacity-90 sm:h-24 sm:opacity-60"
                  style={{ background: getStepGlow(index) }}
                />

                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.08) 50%, transparent 80%)",
                    animation: "wcuShimmer 3.8s linear infinite",
                  }}
                />

                <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white backdrop-blur-xl transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.04] sm:h-14 sm:w-14">
                  <Icon className="size-6 text-white sm:size-7" />
                </div>

                <h3 className="relative mt-4 text-lg font-semibold text-white sm:mt-6 sm:text-xl">
                  {item.title}
                </h3>

                <p className="relative mt-2 text-sm leading-relaxed text-white/62 sm:mt-3 md:text-base">
                  {item.description ||
                    (index === 0
                      ? "See exactly what is available before you commit."
                      : index === 1
                      ? "Book your experience in seconds without back-and-forth."
                      : index === 2
                      ? "Pay confidently through a secure checkout flow."
                      : "Designed for clubs that want to look and feel exceptional.")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}