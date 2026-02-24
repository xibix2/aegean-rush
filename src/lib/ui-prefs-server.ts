// src/lib/ui-prefs-server.ts
import { cookies, headers } from "next/headers";

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

function isValidTenantSlug(slug: string | undefined) {
  if (!slug) return false;
  if (slug === "undefined" || slug === "null") return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

function keyNS(base: string, slug?: string | null) {
  return slug ? `${base}__${slug}` : base;
}
function asTheme(v?: string): UiPrefs["theme"] {
  return (["dark", "light", "auto"] as const).includes(v as any) ? (v as any) : defaults.theme;
}
function asAccent(v?: string): UiPrefs["accent"] {
  return (["pink", "blue", "emerald"] as const).includes(v as any) ? (v as any) : defaults.accent;
}
function asLang(v?: string): UiPrefs["lang"] {
  return (["en", "el", "fr"] as const).includes(v as any) ? (v as any) : defaults.lang;
}
function asCurrency(v?: string): UiPrefs["currency"] {
  const d = v ? decodeURIComponent(v) : undefined;
  return (["€", "$", "£"] as const).includes(d as any) ? (d as any) : defaults.currency;
}

export async function readUiPrefsFromCookies(): Promise<UiPrefs> {
  const jar = await cookies();
  const hdrs = await headers();

  const raw = hdrs.get("x-tenant-slug") || undefined;
  const slug = isValidTenantSlug(raw) ? raw : undefined;

  const get = (k: string) => jar.get(k)?.value;

  const theme    = asTheme(    get(keyNS("ui_theme",    slug)) ?? get("ui_theme"));
  const accent   = asAccent(   get(keyNS("ui_accent",   slug)) ?? get("ui_accent"));
  const compact  =            (get(keyNS("ui_compact",  slug)) ?? get("ui_compact") ?? "0") === "1";
  const lang     = asLang(     get(keyNS("ui_lang",     slug)) ?? get("ui_lang"));
  const currency = asCurrency( get(keyNS("ui_currency", slug)) ?? get("ui_currency"));

  return { theme, accent, compact, lang, currency };
}