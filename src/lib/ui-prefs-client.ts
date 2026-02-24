// src/lib/ui-prefs-client.ts
export type UiPrefsClient = {
  theme: "dark" | "light" | "auto";
  accent: "pink" | "blue" | "emerald";
  lang: string;
  currency: string; // symbol like "€"
  compact: boolean;
};

function getCookieRaw(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="));
  if (!hit) return undefined;
  const raw = hit.substring(name.length + 1);
  try { return decodeURIComponent(raw); } catch { return raw; }
}

const RESERVED = new Set([
  "api","admin","login","privacy","terms","contact",
  "activities","timetable","pricing","about","book","export","_next",
]);

function currentTenantSlug(): string {
  if (typeof window === "undefined") return "";
  const seg = (window.location.pathname.split("/")[1] || "").trim();
  return seg && !RESERVED.has(seg) ? seg : "";
}

function getTenantCookie(base: string, slug: string): string | undefined {
  return slug ? getCookieRaw(`${base}__${slug}`) : undefined;
}

export function readUiPrefsFromDocument(): UiPrefsClient {
  const slug = currentTenantSlug();

  const theme =
    (getTenantCookie("ui_theme", slug) as UiPrefsClient["theme"]) ??
    (getCookieRaw("ui_theme") as UiPrefsClient["theme"]) ??
    "dark";

  const accent =
    (getTenantCookie("ui_accent", slug) as UiPrefsClient["accent"]) ??
    (getCookieRaw("ui_accent") as UiPrefsClient["accent"]) ??
    "pink";

  const lang =
    getTenantCookie("ui_lang", slug) ??
    getCookieRaw("ui_lang") ??
    "en";

  const currency =
    getTenantCookie("ui_currency", slug) ??
    getCookieRaw("ui_currency") ??
    "€";

  const compact =
    (getTenantCookie("ui_compact", slug) ??
      getCookieRaw("ui_compact") ??
      "0") === "1";

  return { theme, accent, lang, currency, compact };
}