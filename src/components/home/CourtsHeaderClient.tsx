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
        className="pointer-events-none absolute -top-10 left-1/2 h-40 w-[80%] -translate-x-1/2 blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(56,189,248,0.15) 40%, transparent 70%)",
        }}
      />

      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
        <Sparkles className="size-3.5 text-pink-300" />
        {resolvedBadgeText}
      </div>

      <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
        <span className="bg-gradient-to-r from-white via-cyan-200 to-pink-300 bg-clip-text text-transparent">
          {resolvedTitle}
        </span>
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
        {resolvedSubtitle}
      </p>

      <div className="mt-6 flex items-center gap-3 opacity-70">
        <div className="h-[2px] w-10 bg-gradient-to-r from-transparent to-pink-400" />
        <Waves className="size-4 text-cyan-300" />
        <div className="h-[2px] w-10 bg-gradient-to-l from-transparent to-cyan-400" />
      </div>
    </div>
  );
}