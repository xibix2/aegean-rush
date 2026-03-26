// src/components/ui/CoverPicker.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type Props = {
  name: string;
  size?: number;
};

export default function CoverPicker({ name, size = 224 }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setLoading(false);
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0];

    if (!file) {
      clear();
      return;
    }

    if (!file.type.startsWith("image/")) {
      clear();
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setLoading(true);
    const url = URL.createObjectURL(file);
    setPreview(url);

    window.setTimeout(() => {
      setLoading(false);
    }, 150);
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-xl u-border u-surface p-2.5 transition hover:u-surface-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-400)]"
          title="Upload cover image"
          aria-label="Upload cover image"
        >
          <ImagePlus className="h-5 w-5 opacity-90" />
        </button>

        <label
          htmlFor={id}
          className="cursor-pointer text-xs opacity-70 hover:opacity-90"
        >
          Upload image
        </label>
      </div>

      <input
        id={id}
        ref={inputRef}
        name={name}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />

      <div
        className="relative ml-12 mt-2 overflow-hidden rounded-2xl u-border"
        style={{ width: size, height: size }}
        aria-live="polite"
      >
        {!preview && (
          <div
            className="absolute inset-0 flex select-none flex-col items-center justify-center rounded-2xl text-sm font-medium"
            style={{
              background: `
                linear-gradient(
                  135deg,
                  color-mix(in oklab, var(--accent-500), black 55%),
                  color-mix(in oklab, var(--accent-600), black 70%)
                ),
                radial-gradient(70% 120% at 50% -10%, color-mix(in oklab, var(--accent-500), transparent 88%), transparent 70%),
                radial-gradient(60% 120% at 0% 100%, color-mix(in oklab, var(--accent-600), transparent 90%), transparent 70%),
                radial-gradient(60% 120% at 100% 100%, color-mix(in oklab, var(--accent-600), transparent 90%), transparent 70%)
              `,
              color: "rgba(255,255,255,.65)",
              backdropFilter: "blur(10px)",
              opacity: 0.9,
              animation: "pulseGlow 7s ease-in-out infinite",
            }}
          >
            <span>Image</span>
          </div>
        )}

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Cover preview"
            className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
            style={{ filter: loading ? "blur(4px) saturate(115%)" : "none" }}
          />
        )}

        {preview && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/65 p-1 text-white transition hover:bg-black/75 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            title="Remove"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes pulseGlow {
  0%,100% { opacity: .85; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.01); }
}
          `.trim(),
        }}
      />
    </div>
  );
}