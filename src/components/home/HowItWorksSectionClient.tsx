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

  if (value.includes("activity") || value.includes("compass")) {
    return Compass;
  }
  if (value.includes("calendar") || value.includes("date") || value.includes("time")) {
    return CalendarDays;
  }
  if (value.includes("pay") || value.includes("check") || value.includes("done")) {
    return CircleCheckBig;
  }

  if (index === 0) return Compass;
  if (index === 1) return CalendarDays;
  return CircleCheckBig;
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
            title: "Pick activity",
            description: "Choose the experience that fits your mood.",
            icon: "compass",
            sortOrder: 0,
          },
          {
            id: "2",
            title: "Pick date & time",
            description: "See real availability and choose your slot instantly.",
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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d14] px-4 py-9 backdrop-blur-xl sm:rounded-[2.1rem] sm:px-6 sm:py-12 md:px-8 md:py-14">
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
@media (prefers-reduced-motion: reduce) {
  .hiw-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div
        className="hiw-anim pointer-events-none absolute left-1/2 top-0 h-36 w-[90%] -translate-x-1/2 blur-3xl sm:h-44 sm:w-[68%]"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.14) 0%, rgba(56,189,248,0.10) 42%, transparent 72%)",
          animation: "hiwGlowA 8s ease-in-out infinite",
        }}
      />

      <div
        className="hiw-anim pointer-events-none absolute left-[4%] top-[20%] h-28 w-28 rounded-full blur-3xl sm:left-[10%] sm:h-36 sm:w-36"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 72%)",
          animation: "hiwGlowB 10s ease-in-out infinite",
        }}
      />

      <div
        className="hiw-anim pointer-events-none absolute right-[2%] bottom-[12%] h-32 w-32 rounded-full blur-3xl sm:right-[8%] sm:h-40 sm:w-40"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 72%)",
          animation: "hiwGlowB 12s ease-in-out infinite",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/70 backdrop-blur-xl sm:mb-4 sm:px-4 sm:text-xs sm:tracking-[0.18em]">
            <Sparkles className="size-3.5 text-pink-300" />
            How it works
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-5xl">
            {title || "Book in three simple steps"}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:mt-4 md:text-base">
            {subtitle ||
              "Pick activity, pick date and time, then pay and you're done."}
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3">
          {resolvedItems.slice(0, 3).map((item, index) => {
            const Icon = getIcon(item.icon, index);

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-white/20 sm:rounded-[1.75rem] sm:p-6"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-50 blur-2xl sm:h-24 sm:opacity-60"
                  style={{
                    background:
                      index === 0
                        ? "radial-gradient(circle, rgba(236,72,153,0.16) 0%, transparent 70%)"
                        : index === 1
                        ? "radial-gradient(circle, rgba(56,189,248,0.16) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 70%)",
                  }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white backdrop-blur-xl sm:h-14 sm:w-14">
                    <Icon className="size-5 text-white sm:size-6" />
                  </div>

                  <div className="text-3xl font-semibold text-white/12 sm:text-4xl">
                    0{index + 1}
                  </div>
                </div>

                <h3 className="relative mt-4 text-lg font-semibold text-white sm:mt-6 sm:text-xl">
                  {item.title}
                </h3>

                <p className="relative mt-2 text-sm leading-relaxed text-white/62 sm:mt-3 md:text-base">
                  {item.description ||
                    (index === 0
                      ? "Choose the experience that fits your mood."
                      : index === 1
                      ? "See real availability and select the best slot for you."
                      : "Complete payment securely and get instant confirmation.")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}