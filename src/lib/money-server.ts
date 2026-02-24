// src/lib/money-server.ts
import { readUiPrefsFromCookies } from "@/lib/ui-prefs-server";

export async function formatMoneyCents(
  cents: number,
  opts?: { currency?: "€" | "$" | "£" }
): Promise<string> {
  const prefs = await readUiPrefsFromCookies();
  const symbol = (opts?.currency ?? prefs.currency) as "€" | "$" | "£";
  const value = (cents || 0) / 100;
  return `${symbol}${value.toFixed(2)}`;
}