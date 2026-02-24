// src/lib/ui-prefs.ts
import { cookies } from "next/headers";

export type UiPrefs = {
  theme: "dark" | "light" | "auto";
  accent: "pink" | "blue" | "emerald";
  compact: boolean;
  lang: "en" | "el" | "fr";
  currency: "€" | "$" | "£";
};

const defaults: UiPrefs = {
  theme: "dark",
  accent: "pink",
  compact: false,
  lang: "en",
  currency: "€",
};

// Server-side reader (RSC / route handlers)
export async function readUiPrefsFromCookies(): Promise<UiPrefs> {
  const jar = await cookies(); // Next 15

  const theme = (jar.get("ui_theme")?.value as UiPrefs["theme"]) ?? defaults.theme;
  const accent = (jar.get("ui_accent")?.value as UiPrefs["accent"]) ?? defaults.accent;
  const compact = jar.get("ui_compact")?.value === "1";
  const lang = (jar.get("ui_lang")?.value as UiPrefs["lang"]) ?? defaults.lang;
  const currency = (jar.get("ui_currency")?.value as UiPrefs["currency"]) ?? defaults.currency;

  return { theme, accent, compact, lang, currency };
}

// Optional: client-side fallback (for Client Components if you need it)
export function readUiPrefsFromDocument(): UiPrefs {
  if (typeof document === "undefined") return defaults;
  const get = (n: string) =>
    document.cookie.split("; ").find((r) => r.startsWith(n + "="))?.split("=")[1];
  return {
    theme: (get("ui_theme") as UiPrefs["theme"]) ?? defaults.theme,
    accent: (get("ui_accent") as UiPrefs["accent"]) ?? defaults.accent,
    compact: get("ui_compact") === "1",
    lang: (get("ui_lang") as UiPrefs["lang"]) ?? defaults.lang,
    currency: (get("ui_currency") as UiPrefs["currency"]) ?? defaults.currency,
  };
}