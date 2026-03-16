"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  isBefore,
  parseISO,
  startOfDay,
  format,
  isValid as isValidDate,
} from "date-fns";

type Slot = {
  id: string;
  startAt: string; // ISO
  price: number;   // cents
  available: boolean;
};

type Props = {
  tenantSlug?: string; // when present, scope page navigation to /{tenantSlug}
  searchParams?: {
    activityId?: string;
    date?: string;      // "YYYY-MM-DD"
    partySize?: string; // number as string
  };
  t: (key: string) => string;
  currency: string; // display glyph/symbol (e.g. "€")
};

// Lightweight detector for the first non-reserved path segment
function detectTenantFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const seg = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  const RESERVED = new Set(["api", "privacy", "terms", "contact", "admin"]);
  return seg && !RESERVED.has(seg) ? seg : null;
}

export default function TimetableClient({
  tenantSlug,
  searchParams = {},
  t,
  currency,
}: Props) {
  const activityId = searchParams.activityId ?? "";
  const dateParam = searchParams.date ?? "";
  const initParty = Number(searchParams.partySize ?? 1) || 1;

  // Base path for tenant-aware PAGE navigation (not for API)
  const [base, setBase] = useState<string>("");
  // Canonical tenant string for API headers
  const [slug, setSlug] = useState<string | null>(tenantSlug ?? null);

  useEffect(() => {
    const s = tenantSlug ?? detectTenantFromPath();
    setSlug(s ?? null);
    setBase(s ? `/${s}` : "");
  }, [tenantSlug]);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(initParty);

  // Disallow same-day & past: compute "tomorrow" at local start of day
  const tomorrow = useMemo(() => addDays(startOfDay(new Date()), 1), []);

  // Parse & validate date param
  const selectedDate = useMemo(() => {
    if (!dateParam) return null;
    const parsed = parseISO(`${dateParam}T00:00:00`);
    return isValidDate(parsed) ? parsed : null;
  }, [dateParam]);

  const invalidDate =
    !selectedDate || isBefore(selectedDate, tomorrow) || !isValidDate(selectedDate);

  // Load slots
  useEffect(() => {
    setErrorMsg(null);

    if (!activityId) {
      setSlots([]);
      setErrorMsg(t("timetable.error.noActivity"));
      return;
    }
    if (!selectedDate) {
      setSlots([]);
      setErrorMsg(t("timetable.error.invalidDate"));
      return;
    }
    if (invalidDate) {
      setSlots([]);
      setErrorMsg(t("timetable.error.fromTomorrow"));
      return;
    }

    setLoading(true);
    // IMPORTANT: API lives at root (/api/...), not under /{club}/api
    const qs = new URLSearchParams({
      activityId,
      date: dateParam,
      partySize: String(partySize),
    }).toString();

    fetch(`/api/availability?${qs}`, {
      cache: "no-store",
      headers: slug ? { "x-tenant-slug": slug } : undefined, // 👈 pass tenant to server
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed to load availability (${r.status})`);
        }
        return r.json();
      })
      .then((data: Slot[] | { slots?: Slot[] }) => {
        // tolerate both shapes
        const list = Array.isArray(data) ? data : Array.isArray(data?.slots) ? data.slots! : [];
        setSlots(list);
      })
      .catch((e) => setErrorMsg(e.message || t("timetable.error.loadFailed")))
      .finally(() => setLoading(false));
  }, [slug, activityId, dateParam, partySize, selectedDate, invalidDate, t]);

  // Header
  const headerDate =
    selectedDate && isValidDate(selectedDate)
      ? format(selectedDate, "EEEE, d MMMM yyyy")
      : t("timetable.header.selectTime");

  // Go to checkout in the same tenant space
  const goCheckout = (slotId: string) => {
    const qs = new URLSearchParams({
      slotId,
      partySize: String(partySize),
    }).toString();
    window.location.href = `${base}/checkout?${qs}`;
  };

  const money = (cents: number) =>
    `${currency}${(Math.max(0, cents) / 100).toFixed(2)}`;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes tl-underline { 0%,100%{opacity:.55; transform:scaleX(.9)} 50%{opacity:.95; transform:scaleX(1)} }
          `.trim(),
        }}
      />

      {/* Title */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-white via-[color-mix(in_oklab,var(--accent-300),white_20%)] to-[color-mix(in_oklab,var(--accent-400),white_10%)] bg-clip-text text-transparent">
              {headerDate}
            </span>
          </h2>
          <div
            className="mt-2 h-[3px] w-36 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0), var(--accent-600), var(--accent-500), var(--accent-600), rgba(0,0,0,0))",
              animation: "tl-underline 3.6s ease-in-out infinite",
            }}
          />
          {!errorMsg ? (
            <p className="mt-2 text-sm opacity-70">{t("timetable.subtitle")}</p>
          ) : null}
        </div>

        {/* Party size control */}
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-2">
          <label className="block text-xs opacity-80 mb-1">
            {t("timetable.players")}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-8 w-8 rounded-lg border border-[--color-border] bg-white/5 hover:bg-white/10"
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              aria-label={t("timetable.aria.decrease")}
            >
              –
            </button>
            <input
              value={partySize}
              onChange={(e) =>
                setPartySize(Math.max(1, Number(e.target.value || 1)))
              }
              type="number"
              min={1}
              className="w-14 h-8 rounded-lg border border-[--color-border] bg-transparent text-center"
            />
            <button
              type="button"
              className="h-8 w-8 rounded-lg border border-[--color-border] bg-white/5 hover:bg-white/10"
              onClick={() => setPartySize((n) => Math.min(50, n + 1))}
              aria-label={t("timetable.aria.increase")}
            >
              +
            </button>
          </div>
        </div>
      </header>

      {/* Errors */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 text-rose-100 p-4 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Loading */}
      {loading && !errorMsg && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-4 text-sm opacity-85">
          {t("timetable.loading")}
        </div>
      )}

      {/* Empty */}
      {!loading && !errorMsg && slots.length === 0 && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-4 text-sm opacity-85">
          {t("timetable.empty")}
        </div>
      )}

      {/* Slots */}
      {!loading && !errorMsg && slots.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {slots.map((s) => {
            const timeLabel = new Date(s.startAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
            const priceLabel = money(s.price);
            const disabled = !s.available;

            return (
              <div
                key={s.id}
                className={[
                  "rounded-2xl border border-[--color-border] bg-[--color-card] p-3",
                  "transition hover:-translate-y-0.5",
                  disabled
                    ? "opacity-50"
                    : "hover:shadow-[0_16px_38px_-22px_color-mix(in_oklab,var(--accent-500),transparent_70%)]",
                ].join(" ")}
              >
                <div className="font-semibold">{timeLabel}</div>
                <div className="text-sm opacity-80">{priceLabel}</div>

                {!s.available && (
                  <div className="mt-1 text-xs opacity-70">
                    {t("timetable.full")}
                  </div>
                )}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => goCheckout(s.id)}
                  className={[
                    "mt-3 inline-flex h-10 w-full items-center justify-center rounded-[12px] px-3 text-sm font-medium",
                    "text-[--color-brand-foreground]",
                    "bg-[linear-gradient(90deg,var(--accent-600),var(--accent-500),var(--accent-600))] bg-[length:200%_100%]",
                    "transition active:scale-[0.98]",
                    disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02]",
                  ].join(" ")}
                >
                  {t("timetable.choose")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}