"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

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

export function FaqSectionClient({
  title,
  subtitle,
  items,
}: FaqSectionClientProps) {
  const [openId, setOpenId] = useState<string | null>(
    items.length > 0 ? items[0].id : "default-0"
  );

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

  return (
    <section className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-[#0b0d14] px-5 py-12 backdrop-blur-xl sm:px-6 md:px-8 md:py-14">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes faqGlowA {
  0%,100% { opacity: .15; transform: scale(1); }
  50% { opacity: .28; transform: scale(1.05); }
}
@keyframes faqGlowB {
  0%,100% { opacity: .12; transform: translateY(0px); }
  50% { opacity: .2; transform: translateY(-10px); }
}
@keyframes faqCardIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
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
        className="faq-anim pointer-events-none absolute left-1/2 top-0 h-44 w-[68%] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.14) 0%, rgba(236,72,153,0.10) 45%, transparent 72%)",
          animation: "faqGlowA 8s ease-in-out infinite",
        }}
      />
      <div
        className="faq-anim pointer-events-none absolute left-[8%] top-[20%] h-36 w-36 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 72%)",
          animation: "faqGlowB 11s ease-in-out infinite",
        }}
      />
      <div
        className="faq-anim pointer-events-none absolute right-[8%] bottom-[10%] h-40 w-40 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 72%)",
          animation: "faqGlowB 13s ease-in-out infinite",
        }}
      />

      <div className="relative mx-auto max-w-4xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
            <HelpCircle className="size-3.5 text-sky-300" />
            FAQ
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {title || "Everything guests usually ask"}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
            {subtitle ||
              "Answer the last few questions before booking and reduce hesitation with clear, friendly information."}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {resolvedItems.map((item, index) => {
            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className="faq-card overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_-50px_rgba(0,0,0,0.95)]"
                style={{
                  animation: `faqCardIn 600ms cubic-bezier(0.22,1,0.36,1) ${index * 80}ms both`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-white/[0.03] md:px-6"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white md:text-lg">
                      {item.question}
                    </h3>
                  </div>

                  <div
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/80 transition duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="size-5" />
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-white/68 md:px-6 md:text-base">
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