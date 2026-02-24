// src/lib/timezone.ts
// Zero-dependency timezone helpers using Intl (Node/browser).
// Build UTC Date objects from a local wall time in a specified IANA TZ.
// Public API preserved.

import { cookies } from "next/headers";

const TZ_COOKIE = "tz";

export const DEFAULT_TZ =
  process.env.ADMIN_TZ ||
  process.env.TZ ||
  "Europe/Athens";

// A small curated list for the admin dropdown.
export const COMMON_TZS = [
  "Europe/Athens",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
] as const;

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */

function isValidIanaTz(tz: string): boolean {
  try {
    // Will throw for invalid timeZone identifiers
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a safe IANA timezone (from provided value or fallback).
 */
export function resolveTz(input?: string | null): string {
  const cand = (input || "").trim();
  if (cand && isValidIanaTz(cand)) return cand;
  return DEFAULT_TZ;
}

/** Parse "YYYY-MM-DD" → [Y, M, D] or null */
function parseYMD(ymd: string): [number, number, number] | null {
  // Strict, numeric only
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const Y = +m[1], M = +m[2], D = +m[3];
  if (M < 1 || M > 12 || D < 1 || D > 31) return null;
  return [Y, M, D];
}

/** Parse "HH:mm" → [h, m] or null (24h only) */
function parseHHmm(hhmm: string): [number, number] | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = +m[1], mm = +m[2];
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return [h, mm];
}

/**
 * Compute the timezone offset (in minutes) for a given instant and IANA TZ.
 * Positive value means local = UTC + offsetMinutes.
 */
export function tzOffsetMinutesAt(tz: string, instant: Date): number {
  // Ensure tz is valid to avoid runtime errors
  if (!isValidIanaTz(tz)) tz = DEFAULT_TZ;

  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",   // <-- fix: "2-digit" (not "two-digit")
    second: "2-digit",
  });

  const parts = f.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  const y = get("year");
  const m = get("month");
  const d = get("day");
  const hh = get("hour");
  const mm = get("minute");
  const ss = get("second");

  // The same instant represented in the target TZ's wall-clock components.
  const localEpochMs = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
  const utcEpochMs = instant.getTime();

  // local = utc + offset → offset = local - utc
  const offsetMs = localEpochMs - utcEpochMs;
  return Math.round(offsetMs / 60000);
}

/**
 * Convert a local wall time (YYYY-MM-DD, HH:MM, 24h) in IANA TZ to a UTC Date.
 * Handles DST by re-evaluating once if offset changes across the guess.
 */
export function localWallTimeToUTC(ymd: string, hhmm: string, tz: string): Date {
  const ymdParts = parseYMD(ymd);
  const timeParts = parseHHmm(hhmm);
  if (!ymdParts || !timeParts) {
    // Fallback to epoch if invalid input; you may throw instead
    return new Date(0);
  }
  if (!isValidIanaTz(tz)) tz = DEFAULT_TZ;

  const [Y, M, D] = ymdParts;
  const [h, m] = timeParts;

  // First guess: interpret the wall time as if it were local, then subtract offset.
  const guessUtc = new Date(Date.UTC(Y, M - 1, D, h, m, 0, 0));
  let off1 = tzOffsetMinutesAt(tz, guessUtc);
  let corrected = new Date(guessUtc.getTime() - off1 * 60000);

  // One refinement around DST boundaries
  const off2 = tzOffsetMinutesAt(tz, corrected);
  if (off2 !== off1) {
    corrected = new Date(guessUtc.getTime() - off2 * 60000);
  }
  return corrected;
}

/**
 * Build a UTC Date representing local 00:00 in the given TZ for the Y-M-D.
 */
export function localStartOfDayUTC(ymd: string, tz: string): Date {
  return localWallTimeToUTC(ymd, "00:00", tz);
}

/**
 * Build a UTC Date representing local 23:59 in the given TZ for the Y-M-D.
 */
export function localEndOfDayUTC(ymd: string, tz: string): Date {
  return localWallTimeToUTC(ymd, "23:59", tz);
}

/**
 * Format a Date (instant) to YYYY-MM-DD in the given TZ (no ISO/UTC slicing).
 */
export function formatYMDInTz(instant: Date, tz: string): string {
  if (!isValidIanaTz(tz)) tz = DEFAULT_TZ;

  // en-CA yields "YYYY-MM-DD"
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return f.format(instant);
}

/**
 * Simple local YMD builder from a Date's local fields (no TZ conversion).
 * Use only when you already know the Date is constructed for the right TZ.
 */
export function toLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Weekday index (0=Sun..6=Sat) for a local Y-M-D in TZ.
 */
export function weekdayInTz(ymd: string, tz: string): number {
  if (!isValidIanaTz(tz)) tz = DEFAULT_TZ;
  const instant = localStartOfDayUTC(ymd, tz); // UTC instant corresponding to local 00:00
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  const label = fmt.format(instant); // "Sun", "Mon", ...
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[label] ?? 0;
}

/* ------------------------------------------------------------------ */
/* Cookies (server-only)                                              */
/* ------------------------------------------------------------------ */

/** Read timezone from the request cookies (server-only). */
export async function readTzFromCookie(): Promise<string | null> {
  try {
    const c = await cookies();
    const v = c.get(TZ_COOKIE)?.value;
    return v ?? null;
  } catch {
    return null;
  }
}

/** Write timezone cookie (server-only). Call from a Server Action or Route. */
export async function writeTzCookie(tz: string): Promise<void> {
  try {
    const c = await cookies();
    const safe = resolveTz(tz);
    c.set(TZ_COOKIE, safe, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,            // readable by client if needed
      sameSite: "lax",
    });
  } catch {
    // ignore if not in a server context
  }
}

/** Active tz for this request, falling back to DEFAULT_TZ. (server-only) */
export async function getActiveTz(): Promise<string> {
  const val = await readTzFromCookie();
  return resolveTz(val);
}


