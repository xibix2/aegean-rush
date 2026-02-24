// src/lib/money.ts
import { readUiPrefsFromCookies } from "@/lib/ui-prefs-server";

/** SERVER: use in Server Components / route handlers */
export async function formatMoneyCents(
  cents: number,
  opts?: { currency?: "€" | "$" | "£" }
): Promise<string> {
  const prefs = await readUiPrefsFromCookies();
  const symbol = (opts?.currency ?? prefs.currency) as "€" | "$" | "£";
  const value = (cents || 0) / 100;
  return `${symbol}${value.toFixed(2)}`;
}

/** CLIENT: use in Client Components (no async) */
export function formatMoneyCentsClient(
  cents: number,
  opts?: { currency?: "€" | "$" | "£" }
): string {
  const value = (cents || 0) / 100;
  const symbol =
    opts?.currency ??
    (typeof document !== "undefined"
      ? ((document.cookie
          .split("; ")
          .find((r) => r.startsWith("ui_currency="))
          ?.split("=")[1] as "€" | "$" | "£") || "€")
      : "€");

  return `${symbol}${value.toFixed(2)}`;
}