// src/components/home/HowItWorksSectionClient.tsx
"use client";

import { CalendarDays, CircleCheckBig, Compass, Sparkles } from "lucide-react";

type HowItWorksItem = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
};

type HowItWorksSectionClientProps = {
  title?: string | null;
  subtitle?: string | null;
  items: HowItWorksItem[];
};

function getIcon(icon: string | null, index: number) {
  const value = (icon || "").toLowerCase();

  if (value.includes("activity") || value.includes("experience") || value.includes("compass")) {
    return Compass;
  }
  if (
    value.includes("calendar") ||
    value.includes("date") ||
    value.includes("time")
  ) {
    return CalendarDays;
  }
  if (
    value.includes("pay") ||
    value.includes("check") ||
    value.includes("done") ||
    value.includes("book")
  ) {
    return CircleCheckBig;
  }

  if (index === 0) return Compass;
  if (index === 1) return CalendarDays;
  return CircleCheckBig;
}

function getStepGlow(index: number) {
  if (index === 0) {
    return "radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 72%)";
  }
  if (index === 1) {
    return "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 72%)";
  }
  return "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 72%)";
}

export function HowItWorksSectionClient({
  title,
  subtitle,
  items,
}: HowItWorksSectionClientProps) {
  const resolvedItems =
    items.length > 0
      ? items
      : [
          {
            id: "1",
            title: "Choose your experience",
            description: "Browse the activities and pick the one that fits your mood.",
            icon: "experience",
            sortOrder: 0,
          },
          {
            id: "2",
            title: "Pick your time",
            description: "Choose your date and time with real-time availability.",
            icon: "calendar",
            sortOrder: 1,
          },
          {
            id: "3",
            title: "Pay and you're done",
            description: "Secure your booking in seconds and get instant confirmation.",
            icon: "check",
            sortOrder: 2,
          },
        ];

  return (
    <section className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-[#0b0d14] px-5 py-12 backdrop-blur-xl sm:px-6 md:px-8 md:py-14">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes hiwGlowA {
  0%,100% { opacity: .16; transform: scale(1); }
  50% { opacity: .3; transform: scale(1.05); }
}
@keyframes hiwGlowB {
  0%,100% { opacity: .12; transform: translateY(0px); }
  50% { opacity: .22; transform: translateY(-10px); }
}
@keyframes hiwCardIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes hiwShimmer {
  0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
  20% { opacity: .08; }
  50% { opacity: .14; }
  100% { transform: translateX(140%) skewX(-18deg); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .hiw-anim,
  .hiw-card {
    animation: none !important;
    transition: none !important;
  }
}
          `.trim(),
        }}
      />

      <div
        className="hiw-anim pointer-events-none absolute left-1/2 top-0 h-44 w-[68%] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.14) 0%, rgba(56,189,248,0.10) 42%, transparent 72%)",
          animation: "hiwGlowA 8s ease-in-out infinite",
        }}
      />
      <div
        className="hiw-anim pointer-events-none absolute left-[10%] top-[20%] h-36 w-36 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 72%)",
          animation: "hiwGlowB 10s ease-in-out infinite",
        }}
      />
      <div
        className="hiw-anim pointer-events-none absolute right-[8%] bottom-[12%] h-40 w-40 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 72%)",
          animation: "hiwGlowB 12s ease-in-out infinite",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
            <Sparkles className="size-3.5 text-pink-300" />
            How it works
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {title || "Book in three simple steps"}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
            {subtitle ||
              "Choose your experience, pick your date and time, then pay and you're done."}
          </p>
        </div>

        <div className="relative mt-10">
          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-1/2 hidden h-px -translate-y-1/2 md:block">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-pink-400/25 to-cyan-300/20 blur-sm" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {resolvedItems.slice(0, 3).map((item, index) => {
              const Icon = getIcon(item.icon, index);

              return (
                <div
                  key={item.id}
                  className="hiw-card group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.055]"
                  style={{
                    animation: `hiwCardIn 600ms cubic-bezier(0.22,1,0.36,1) ${index * 90}ms both`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60 blur-2xl transition duration-500 group-hover:opacity-90"
                    style={{ background: getStepGlow(index) }}
                  />

                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.08) 50%, transparent 80%)",
                      animation: "hiwShimmer 3.8s linear infinite",
                    }}
                  />

                  <div className="relative flex items-center justify-between">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white backdrop-blur-xl transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.04]">
                      <Icon className="size-7 text-white" />
                    </div>

                    <div className="text-4xl font-semibold text-white/[0.06] transition duration-300 group-hover:text-white/[0.09]">
                      0{index + 1}
                    </div>
                  </div>

                  <h3 className="relative mt-6 text-xl font-semibold text-white">
                    {item.title}
                  </h3>

                  <p className="relative mt-3 text-sm leading-relaxed text-white/62 md:text-base">
                    {item.description ||
                      (index === 0
                        ? "Browse the activities and pick the one that fits your mood."
                        : index === 1
                        ? "Choose your date and time with real-time availability."
                        : "Secure your booking in seconds and get instant confirmation.")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}