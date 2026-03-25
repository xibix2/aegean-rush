"use client";

import { useT } from "@/components/I18nProvider";
import { Waves, Sparkles } from "lucide-react";

export function CourtsHeaderClient() {
  const t = useT();

  return (
    <div className="relative flex flex-col items-center text-center">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-40 w-[80%] blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(56,189,248,0.15) 40%, transparent 70%)",
        }}
      />

      {/* top label */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
        <Sparkles className="size-3.5 text-pink-300" />
        Featured experiences
      </div>

      {/* title */}
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
        <span className="bg-gradient-to-r from-white via-cyan-200 to-pink-300 bg-clip-text text-transparent">
          {t("home.courts.title")}
        </span>
      </h2>

      {/* subtitle */}
      <p className="mt-3 max-w-xl text-sm md:text-base text-white/70 leading-relaxed">
        Discover high-energy Aegean experiences. Book instantly and get straight into the action.
      </p>

      {/* divider */}
      <div className="mt-6 flex items-center gap-3 opacity-70">
        <div className="h-[2px] w-10 bg-gradient-to-r from-transparent to-pink-400" />
        <Waves className="size-4 text-cyan-300" />
        <div className="h-[2px] w-10 bg-gradient-to-l from-transparent to-cyan-400" />
      </div>
    </div>
  );
}