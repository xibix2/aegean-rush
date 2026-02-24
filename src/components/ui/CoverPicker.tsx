"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type Props = {
  name: string;     // e.g. "coverFile"
  size?: number;    // square size in px (default 224)
};

export default function CoverPicker({ name, size = 224 }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep the current object URL so we can revoke it when replaced/cleared
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const clear = () => {
    // Revoke any existing preview URL
    if (preview) URL.revokeObjectURL(preview);
    // Clear the input so the same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setLoading(false);
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0];
    // No file picked
    if (!file) {
      clear();
      return;
    }
    // Must be an image (basic safeguard; server can still validate)
    if (!file.type.startsWith("image/")) {
      clear();
      return;
    }

    // Replace preview, revoking previous URL if needed
    if (preview) URL.revokeObjectURL(preview);
    setLoading(true);
    const url = URL.createObjectURL(file);
    setPreview(url);
    // tiny delay for a softer blur-in effect
    const t = setTimeout(() => setLoading(false), 150);
    // ensure timer cleared if component unmounts quickly
    return () => clearTimeout(t);
  };

  return (
    <div className="flex flex-col gap-3 items-start">
      {/* Trigger + hint */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-xl u-border u-surface p-2.5 hover:u-surface-2 transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-400)]"
          title="Upload cover image"
          aria-label="Upload cover image"
        >
          <ImagePlus className="h-5 w-5 opacity-90" />
        </button>
        {/* Clickable label also focuses hidden input (a11y) */}
        <label htmlFor={id} className="text-xs opacity-70 cursor-pointer hover:opacity-90">
          Upload image (square preview below)
        </label>
      </div>

      {/* Hidden input */}
      <input
        id={id}
        ref={inputRef}
        name={name}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />

      {/* Square preview area */}
      <div
        className="relative overflow-hidden rounded-2xl u-border ml-12 mt-8"
        style={{ width: size, height: size }}
        aria-live="polite"
      >
        {/* Placeholder */}
        {!preview && (
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-sm font-medium select-none"
            style={{
              background: `
                linear-gradient(
                  135deg,
                  color-mix(in oklab, var(--accent-500), black 55%),
                  color-mix(in oklab, var(--accent-600), black 70%)
                ),
                radial-gradient(70% 120% at 50% -10%, color-mix(in oklab, var(--accent-500), transparent 88%), transparent 70%),
                radial-gradient(60% 120% at 0% 100%,  color-mix(in oklab, var(--accent-600), transparent 90%), transparent 70%),
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

        {/* Preview */}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Cover preview"
            className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
            style={{ filter: loading ? "blur(4px) saturate(115%)" : "none" }}
          />
        )}

        {/* Remove */}
        {preview && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/65 text-white p-1 hover:bg-black/75 transition focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            title="Remove"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* subtle animation keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes pulseGlow {
  0%,100% { opacity: .85; transform: scale(1); }
  50%     { opacity: 1;    transform: scale(1.01); }
}
@media (prefers-reduced-motion: reduce){
  div[style*="pulseGlow"] { animation: none !important; }
}
          `.trim(),
        }}
      />
    </div>
  );
}