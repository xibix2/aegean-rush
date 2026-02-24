// src/components/admin/Sparkline.tsx
"use client";

import React from "react";

type Props = {
  data: number[];
  width?: number;   // defaults via viewBox
  height?: number;  // pixel height of SVG
  strokeWidth?: number;
  dotEvery?: number; // draw a dot every N points
  ariaLabel?: string;
};

export default function Sparkline({
  data,
  height = 120,
  strokeWidth = 2,
  dotEvery = 0,
  ariaLabel = "Sparkline",
}: Props) {
  const n = Math.max(1, data.length);
  const w = Math.max(60, n * 24); // dynamic width based on points

  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);

  const scaleX = (i: number) => (i / (n - 1 || 1)) * (w - 20) + 10;
  const scaleY = (v: number) => {
    if (max === min) return height / 2;
    const t = (v - min) / (max - min);
    return (1 - t) * (height - 20) + 10;
  };

  const pts = data.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        role="img"
        aria-label={ariaLabel}
        width={w}
        height={height}
        viewBox={`0 0 ${w} ${height}`}
      >
        {/* baseline */}
        <line
          x1={10}
          y1={height - 10}
          x2={w - 10}
          y2={height - 10}
          stroke="currentColor"
          opacity={0.12}
        />
        {/* area fill */}
        <polyline
          points={`${pts} ${w - 10},${height - 10} 10,${height - 10}`}
          fill="currentColor"
          opacity={0.12}
        />
        {/* line */}
        <polyline
          points={pts}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          style={{ color: "var(--accent-500)" }}
        />
        {/* optional dots */}
        {dotEvery > 0 &&
          data.map((v, i) =>
            i % dotEvery === 0 ? (
              <circle
                key={i}
                cx={scaleX(i)}
                cy={scaleY(v)}
                r={3}
                style={{ fill: "var(--accent-500)" }}
              />
            ) : null
          )}
      </svg>
    </div>
  );
}