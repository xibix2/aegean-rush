// src/components/home/CourtsHeaderClient.tsx
"use client";

import { useT } from "@/components/I18nProvider";
import { Waves, Sparkles } from "lucide-react";

type CourtsHeaderClientProps = {
  badgeText?: string | null;
  title?: string | null;
  subtitle?: string | null;
};

export function CourtsHeaderClient({
  badgeText,
  title,
  subtitle,
}: CourtsHeaderClientProps) {
  const t = useT();

  const resolvedBadgeText = badgeText || "Featured experiences";
  const resolvedTitle = title || t("home.courts.title");
  const resolvedSubtitle =
    subtitle ||
    "Discover high-energy Aegean experiences. Book instantly and get straight into the action.";

  return (
    <div className="relative flex flex-col items-center text-center">
      <div
        className="pointer-events-none absolute -top-8 left-1/2 h-32 w-[92%] -translate-x-1/2 opacity-30 blur-3xl sm:-top-10 sm:h-40 sm:w-[80%] sm:opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(56,189,248,0.15) 40%, transparent 70%)",
        }}
      />

      <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/70 backdrop-blur-xl sm:mb-4 sm:px-4 sm:text-xs sm:tracking-[0.18em]">
        <Sparkles className="size-3.5 shrink-0 text-pink-300" />
        <span className="truncate">{resolvedBadgeText}</span>
      </div>

      <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
        <span className="bg-gradient-to-r from-white via-cyan-200 to-pink-300 bg-clip-text text-transparent">
          {resolvedTitle}
        </span>
      </h2>

      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 sm:mt-3 md:text-base">
        {resolvedSubtitle}
      </p>

      <div className="mt-4 flex items-center gap-3 opacity-70 sm:mt-6">
        <div className="h-[2px] w-8 bg-gradient-to-r from-transparent to-pink-400 sm:w-10" />
        <Waves className="size-4 text-cyan-300" />
        <div className="h-[2px] w-8 bg-gradient-to-l from-transparent to-cyan-400 sm:w-10" />
      </div>
    </div>
  );
}