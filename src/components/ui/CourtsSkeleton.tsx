// src/components/ui/CourtsSkeleton.tsx
export default function CourtsSkeleton() {
  return (
    <section className="space-y-3" aria-busy="true" aria-live="polite">
      {/* Local keyframes (shimmer + glow) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes sk-pulse { 0%,100%{opacity:.55} 50%{opacity:.95} }
@keyframes sk-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .sk-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-card]"
              role="status"
              aria-label="Loading court card"
            >
              {/* faint accent wash, very dim */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: 0.15,
                  background: `
                    radial-gradient(60% 120% at 50% -10%, color-mix(in oklab, var(--accent-500), transparent 90%), transparent 70%),
                    radial-gradient(60% 100% at 0% 100%,  color-mix(in oklab, var(--accent-600), transparent 92%), transparent 70%),
                    radial-gradient(60% 100% at 100% 100%, color-mix(in oklab, var(--accent-600), transparent 92%), transparent 70%)
                  `,
                  maskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,.9) 30%, rgba(0,0,0,.9) 70%, rgba(0,0,0,.7))",
                }}
              />

              {/* Image placeholder with shimmer */}
              <div
                aria-hidden="true"
                className="h-44 w-full sk-anim"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.06) 63%)",
                  backgroundSize: "400% 100%",
                  animation: "sk-shimmer 1.8s ease-in-out infinite",
                }}
              />

              <div className="p-5 space-y-3">
                <div
                  aria-hidden="true"
                  className="h-4 w-2/3 rounded sk-anim"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.06) 63%)",
                    backgroundSize: "400% 100%",
                    animation: "sk-shimmer 2.2s ease-in-out infinite",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="h-3 w-full rounded sk-anim"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%)",
                    backgroundSize: "400% 100%",
                    animation: "sk-shimmer 2.2s ease-in-out infinite",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="h-3 w-5/6 rounded sk-anim"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%)",
                    backgroundSize: "400% 100%",
                    animation: "sk-shimmer 2.2s ease-in-out infinite",
                  }}
                />

                {/* CTA placeholder with accent-aware dim tone */}
                <div
                  aria-hidden="true"
                  className="h-10 w-32 rounded-[12px] sk-anim"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--accent-500), black 70%), color-mix(in oklab, var(--accent-600), black 72%))",
                    boxShadow:
                      "0 0 0 1px rgba(255,255,255,0.06) inset, 0 10px 24px -16px var(--accent-600)",
                    animation: "sk-pulse 2.8s ease-in-out infinite",
                  }}
                />
              </div>
              <span className="sr-only">Loading…</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}