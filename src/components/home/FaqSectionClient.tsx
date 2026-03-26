"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

type FaqSectionClientProps = {
  title?: string | null;
  subtitle?: string | null;
  items: FaqItem[];
};

function getFaqGlow(index: number) {
  if (index === 0) {
    return "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 72%)";
  }
  if (index === 1) {
    return "radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 72%)";
  }
  if (index === 2) {
    return "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 72%)";
  }
  return "radial-gradient(circle, rgba(34,197,94,0.16) 0%, transparent 72%)";
}

export function FaqSectionClient({
  title,
  subtitle,
  items,
}: FaqSectionClientProps) {
  const resolvedItems =
    items.length > 0
      ? items
      : [
          {
            id: "default-0",
            question: "Do I need experience before booking?",
            answer:
              "Not at all. Many experiences are beginner-friendly, and the club can guide guests toward the best option based on comfort level and experience.",
            sortOrder: 0,
          },
          {
            id: "default-1",
            question: "Can I book in advance?",
            answer:
              "Yes. Guests can choose their preferred date and time based on real-time availability and secure their spot instantly online.",
            sortOrder: 1,
          },
          {
            id: "default-2",
            question: "What should I bring with me?",
            answer:
              "Usually just swimwear, a towel, sunscreen, and a good mood. Specific activities may include extra recommendations from the club.",
            sortOrder: 2,
          },
          {
            id: "default-3",
            question: "What happens after I complete my booking?",
            answer:
              "You receive confirmation right away, so you know your experience is reserved and ready for you.",
            sortOrder: 3,
          },
        ];

  const [openId, setOpenId] = useState<string | null>(resolvedItems[0]?.id ?? null);

  return (
    <section className="relative overflow-hidden rounded-[2.15rem] border border-white/10 bg-[#070b16] px-5 py-12 backdrop-blur-xl sm:px-6 md:px-8 md:py-16">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes faqGlowMain {
  0%,100% { opacity: .22; transform: scale(1) translateY(0px); }
  50% { opacity: .4; transform: scale(1.05) translateY(-6px); }
}
@keyframes faqGlowFloat {
  0%,100% { opacity: .14; transform: translateY(0px); }
  50% { opacity: .25; transform: translateY(-14px); }
}
@keyframes faqGridMove {
  0% { transform: translateX(0px) translateY(0px); }
  50% { transform: translateX(8px) translateY(-6px); }
  100% { transform: translateX(0px) translateY(0px); }
}
@keyframes faqCardIn {
  from { opacity: 0; transform: translateY(20px) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes faqShimmer {
  0% { transform: translateX(-120%) skewX(-16deg); opacity: 0; }
  20% { opacity: .06; }
  50% { opacity: .12; }
  100% { transform: translateX(140%) skewX(-16deg); opacity: 0; }
}
@keyframes faqPulseRing {
  0%,100% { box-shadow: 0 0 0 0 rgba(236,72,153,.14); }
  50% { box-shadow: 0 0 0 10px rgba(236,72,153,0); }
}
@media (prefers-reduced-motion: reduce) {
  .faq-anim,
  .faq-card {
    animation: none !important;
    transition: none !important;
  }
}
          `.trim(),
        }}
      />

      <div
        className="faq-anim pointer-events-none absolute left-1/2 top-0 h-56 w-[74%] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(236,72,153,0.14) 38%, rgba(168,85,247,0.16) 58%, transparent 76%)",
          animation: "faqGlowMain 9s ease-in-out infinite",
        }}
      />
      <div
        className="faq-anim pointer-events-none absolute left-[4%] top-[18%] h-40 w-40 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 72%)",
          animation: "faqGlowFloat 11s ease-in-out infinite",
        }}
      />
      <div
        className="faq-anim pointer-events-none absolute right-[6%] bottom-[14%] h-44 w-44 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 72%)",
          animation: "faqGlowFloat 13s ease-in-out infinite",
        }}
      />
      <div
        className="faq-anim pointer-events-none absolute left-[28%] bottom-[8%] h-32 w-32 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 72%)",
          animation: "faqGlowFloat 12s ease-in-out infinite",
        }}
      />

      <div
        className="faq-anim pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage:
            "radial-gradient(circle at center, black 35%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 35%, transparent 82%)",
          animation: "faqGridMove 16s ease-in-out infinite",
        }}
      />

      <div className="relative mx-auto max-w-4xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/72 shadow-[0_10px_30px_-18px_rgba(56,189,248,0.5)] backdrop-blur-xl">
            <HelpCircle className="size-3.5 text-sky-300" />
            FAQ
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {title || "Frequently asked questions"}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/66 md:text-base">
            {subtitle ||
              "Everything guests usually want to know before booking — answered clearly and beautifully."}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {resolvedItems.map((item, index) => {
            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className="faq-card group relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.045] shadow-[0_24px_90px_-54px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                style={{
                  animation: `faqCardIn 700ms cubic-bezier(0.22,1,0.36,1) ${index * 90}ms both`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60 blur-2xl transition duration-500 group-hover:opacity-100"
                  style={{ background: getFaqGlow(index) }}
                />

                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 18%, rgba(255,255,255,0.08) 50%, transparent 82%)",
                    animation: "faqShimmer 4.2s linear infinite",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="relative flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/85 backdrop-blur-xl">
                      <Sparkles className="size-4 text-pink-300" />
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-white md:text-lg">
                        {item.question}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/85 backdrop-blur-xl transition duration-300 ${
                      isOpen ? "rotate-180 scale-105" : ""
                    }`}
                    style={{
                      animation: isOpen ? "faqPulseRing 1.8s ease-in-out infinite" : undefined,
                    }}
                  >
                    <ChevronDown className="size-5" />
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-400 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="relative border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-white/70 md:px-6 md:text-base">
                      <div className="pointer-events-none absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-pink-400/40 to-transparent" />
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}