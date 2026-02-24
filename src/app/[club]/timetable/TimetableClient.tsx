// src/app/[club]/timetable/TimetableClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, addMonths, subMonths, parse } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";
import MonthCalendar from "@/components/MonthCalendar";
import { useT } from "@/components/I18nProvider";

type DayBucket = "none" | "low" | "medium" | "high" | "full";
type DayInfo = { capacity: number; paid: number; remaining: number; bucket: DayBucket };

type Slot = {
  id: string;
  start: string;
  end: string;
  remaining: number;
  canFit: boolean;
  pricePerPerson: number; // cents
  totalPrice: number; // cents
};

const TIMEZONE = "Europe/Athens";

/* Detect tenant from first URL segment on the client */
function detectTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  const seg = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  if (!seg || ["api", "privacy", "terms", "contact"].includes(seg)) return null;
  return seg;
}

function calcBucket(remaining: number, capacity: number): DayBucket {
  if (capacity <= 0) return "none";
  if (remaining <= 0) return "full";
  const ratio = remaining / capacity;
  if (ratio >= 0.67) return "high";
  if (ratio >= 0.34) return "medium";
  return "low";
}

export default function TimetableClient() {
  const t = useT();

  const params = useSearchParams();
  const router = useRouter();

  const activityId = params.get("activityId") ?? "";
  const date = params.get("date") ?? "";

  const [partySize, setPartySize] = useState<number>(Number(params.get("partySize") ?? 1));
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  const tenantSlug = useMemo(() => detectTenantSlug(), []);
  const base = tenantSlug ? `/${tenantSlug}` : "";

  const minBookable = useMemo(
    () => formatInTimeZone(addDays(new Date(), 1), TIMEZONE, "yyyy-MM-dd"),
    []
  );

  const safeDate = date || minBookable;

  const [month, setMonth] = useState(() => Number(safeDate.slice(5, 7)));
  const [year, setYear] = useState(() => Number(safeDate.slice(0, 4)));
  const [heat, setHeat] = useState<Record<string, DayInfo>>({});

  const safeParamsCopy = () => new URLSearchParams(Array.from(params.entries()));
  const ymd = (d: Date) => format(d, "yyyy-MM-dd");
  const ym = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const clampToMin = (s: string) => (s < minBookable ? minBookable : s);

  /* Slug-safe router.replace */
  const setQuery = (updates: Partial<{ date: string; partySize: number }>) => {
    const q = safeParamsCopy();
    if (updates.date) q.set("date", clampToMin(updates.date));
    if (updates.partySize != null) q.set("partySize", String(updates.partySize));
    if (!q.get("activityId")) q.set("activityId", activityId);

    // Update URL without jumping to the top
    router.replace(`${base}/timetable?${q.toString()}`, { scroll: false });
  };

  /* Normalize month heat map payloads */
  const normalizeDays = (raw: unknown): Record<string, DayInfo> => {
    const out: Record<string, DayInfo> = {};
    if (!raw || typeof raw !== "object") return out;

    for (const [iso, val] of Object.entries(raw as Record<string, unknown>)) {
      if (val && typeof val === "object" && "capacity" in val && "remaining" in val) {
        const cap = Number((val as any).capacity) || 0;
        const rem = Number((val as any).remaining) || 0;
        const paid = Number((val as any).paid) || Math.max(cap - rem, 0);
        const bucket =
          (val as any).bucket && typeof (val as any).bucket === "string"
            ? ((val as any).bucket as DayBucket)
            : calcBucket(rem, cap);
        out[iso] = { capacity: cap, remaining: rem, paid, bucket };
        continue;
      }
      if (typeof val === "number") {
        const n = Number(val) || 0;
        out[iso] = { capacity: n, remaining: n, paid: 0, bucket: calcBucket(n, n) };
        continue;
      }
      out[iso] = { capacity: 0, remaining: 0, paid: 0, bucket: "none" };
    }
    return out;
  };

  /* Shared fetch init — adds slug header */
  const commonFetchInit = useMemo<RequestInit>(() => {
    const headers = new Headers();
    headers.set("cache-control", "no-store");
    if (tenantSlug) headers.set("x-tenant-slug", tenantSlug);
    return { headers, cache: "no-store" as RequestCache };
  }, [tenantSlug]);

  /* Month heat */
  const fetchMonth = async (y: number, m: number) => {
    if (!activityId) return;
    try {
      const qs = new URLSearchParams({ activityId, month: ym(y, m) }).toString();
      const url = `/api/availability/month?${qs}`;
      const res = await fetch(url, commonFetchInit);
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[month] GET",
          url,
          Object.fromEntries((commonFetchInit.headers as Headers).entries()),
          res.status
        );
      }
      if (!res.ok) {
        setHeat({ });
        return;
      }
      const json = await res.json();
      if (process.env.NODE_ENV !== "production") console.log("[month] payload", json);
      const daysBlock =
        json && typeof json === "object" && "days" in (json as any)
          ? (json as any).days
          : json;
      setHeat(normalizeDays(daysBlock));
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.warn("[month] error", err);
      setHeat({ });
    }
  };

  /* Day slots — tolerant parser */
  const pickSlotsArray = (json: any): Slot[] => {
    if (Array.isArray(json)) return json as Slot[];
    if (json && typeof json === "object") {
      if (Array.isArray(json.slots)) return json.slots as Slot[];
      if (json.data && Array.isArray(json.data.slots)) return json.data.slots as Slot[];
      if (json.availability && Array.isArray(json.availability.slots))
        return json.availability.slots as Slot[];
    }
    return [];
  };

  const fetchAvailability = async (ps: number) => {
    if (!activityId || !safeDate) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        activityId,
        date: safeDate,
        partySize: String(ps),
      }).toString();
      const url = `/api/availability/day?${qs}`;
      const res = await fetch(url, commonFetchInit);
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[day] GET",
          url,
          Object.fromEntries((commonFetchInit.headers as Headers).entries()),
          res.status
        );
      }
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(t("timetable.errors.loadAvailability"));

      const list = pickSlotsArray(json);
      setSlots(Array.isArray(list) ? list : []);
      if (process.env.NODE_ENV !== "production") console.log("[day] parsed slots", list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("timetable.errors.generic");
      toast?.error(msg);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  /* Checkout */
  const handleChooseSlot = async (slotId: string, _totalCents: number) => {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {}),
        },
        body: JSON.stringify({ activityId, slotId, partySize }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("timetable.errors.checkoutFailed"));
      window.location.href = json.url;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("timetable.errors.checkoutGeneric");
      toast?.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Ensure date param is present and >= minBookable */
  useEffect(() => {
    if (!activityId) return;
    if (!date || date < minBookable) {
      const q = safeParamsCopy();
      q.set("date", date ? clampToMin(date) : minBookable);
      if (!q.get("activityId")) q.set("activityId", activityId);
      // Avoid scroll jump on initial normalization
      router.replace(`${base}/timetable?${q.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* React to date/activity changes */
  useEffect(() => {
    if (!activityId || !safeDate) return;
    fetchAvailability(partySize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, safeDate, tenantSlug]);

  /* Month heat reactiveness */
  useEffect(() => {
    if (!activityId) return;
    fetchMonth(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, month, year, tenantSlug]);

  /* Controls */
  const onPartyChange = (n: number) => {
    const v = Math.max(1, Math.min(20, Number.isFinite(n) ? n : 1));
    setPartySize(v);
    fetchAvailability(v);
    setQuery({ partySize: v });
  };

  const onDateInputChange = (s: string) => {
    if (s) setQuery({ date: s });
  };

  const goPrevDay = () => {
    const d = parse(`${safeDate}`, "yyyy-MM-dd", new Date());
    setQuery({ date: ymd(addDays(d, -1)) });
  };
  const goNextDay = () => {
    const d = parse(`${safeDate}`, "yyyy-MM-dd", new Date());
    setQuery({ date: ymd(addDays(d, +1)) });
  };
  const onPickDay = (iso: string) => setQuery({ date: iso });

  const prevMonth = () => {
    const d = subMonths(new Date(year, month - 1, 1), 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };
  const nextMonth = () => {
    const d = addMonths(new Date(year, month - 1, 1), 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const pretty = format(parse(safeDate, "yyyy-MM-dd", new Date()), "eeee, d MMM yyyy");
  const isAtMin = safeDate <= minBookable;

  return (
    <main className="mx-auto max-w-5xl px-0 sm:px-6 py-3 sm:py-6 space-y-8">
      {/* utilities & no-spinner for number input */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
.no-spin::-webkit-outer-spin-button, .no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spin { -moz-appearance: textfield; appearance: textfield; }
@keyframes tFade {0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:none}}
@keyframes tShimmer {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes tGlowLine {0%,100%{opacity:.5;transform:scaleX(.9)}50%{opacity:.95;transform:scaleX(1)}}
@keyframes tPulseSoft {0%,100%{opacity:1;transform:none} 50%{opacity:.96; transform:translateY(-1px)}}
@media (prefers-reduced-motion: reduce){ .t-anim{animation:none!important} }
          `.trim(),
        }}
      />

      {/* --- PAGE TITLE --- */}
      <div className="text-center mb-8 mt-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,200,80,0.25)]">
          {t("timetable.title")}
        </h1>
        <div className="mx-auto mt-2 h-[3px] w-32 rounded-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-[pulse_7s_ease-in-out_infinite]" />
        <p className="mt-3 text-sm text-muted-foreground opacity-80">
          {t("timetable.subtitle2")}
        </p>
      </div>

      {/* CALENDAR */}
      <section
        className="relative rounded-2xl overflow-hidden t-anim"
        style={{ animation: "tFade .35s ease-out" }}
      >
        <div className="-mx-4 px-2 py-4 sm:mx-0 sm:p-6">
          <MonthCalendar
            year={year}
            month={month}
            data={heat}
            onPick={onPickDay}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            minDate={minBookable}
            selectedDate={safeDate}
          />
        </div>
      </section>

      {/* CONTROLS BAR */}
      <div className="mx-auto max-w-5xl">
        <div className="relative rounded-2xl">
          {/* gradient stroke */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            aria-hidden
            style={{
              background:
                "linear-gradient(90deg, rgba(147,51,234,.45), rgba(255,210,80,.4), rgba(176,136,248,.45))",
              padding: 1,
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          {/* elegant background */}
          <div
            className="relative rounded-[calc(theme(borderRadius.2xl)-1px)] px-3 py-2 border border-[--color-border]"
            style={{
              background:
                "radial-gradient(120% 140% at 10% -40%, rgba(147,51,234,.16), transparent 55%), radial-gradient(120% 140% at 90% 140%, rgba(255,210,80,.12), transparent 55%), linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02))",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.35'/%3E%3Ccircle cx='20' cy='14' r='1' fill='%23ffffff' fill-opacity='0.3'/%3E%3Ccircle cx='12' cy='26' r='1' fill='%23ffffff' fill-opacity='0.28'/%3E%3Ccircle cx='30' cy='32' r='1' fill='%23ffffff' fill-opacity='0.28'/%3E%3C/svg%3E\")",
              }}
            />

            <div className="relative z-10 flex flex-wrap items-center gap-2">
              {/* prev */}
              <button
                type="button"
                onClick={goPrevDay}
                disabled={loading || isAtMin}
                className="rounded-lg px-3 py-1.5 text-sm border border-white/10 bg-black/30 hover:bg-black/40 disabled:opacity-40 transition shadow-[inset_0_0_0_1px_rgba(255,255,255,.03)]"
                aria-label={t("timetable.controls.prevAria")}
                title={
                  isAtMin ? t("timetable.controls.noPast") : t("timetable.controls.prevTitle")
                }
              >
                ‹
              </button>

              {/* date input */}
              <input
                type="date"
                value={safeDate}
                min={minBookable}
                onChange={(e) => onDateInputChange(e.target.value)}
                className="rounded-lg px-3 py-1.5 text-sm border border-white/10 bg-black/25 outline-none focus:ring-2 focus:ring-amber-400/40"
                aria-label={t("timetable.controls.datePicker")}
              />

              {/* next */}
              <button
                type="button"
                onClick={goNextDay}
                disabled={loading}
                className="rounded-lg px-3 py-1.5 text-sm border border-white/10 bg-black/30 hover:bg-black/40 disabled:opacity-40 transition shadow-[inset_0_0_0_1px_rgba(255,255,255,.03)]"
                aria-label={t("timetable.controls.nextAria")}
              >
                ›
              </button>

              {/* party size */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm opacity-70">{t("timetable.controls.party")}</span>
                <div className="flex items-center rounded-lg border border-white/10 bg-black/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,.03)]">
                  <button
                    className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                    onClick={() => onPartyChange(partySize - 1)}
                    disabled={loading}
                    aria-label={t("timetable.controls.decrease")}
                  >
                    −
                  </button>
                  <input
                    id="party"
                    type="number"
                    min={1}
                    max={20}
                    value={partySize}
                    onChange={(e) => onPartyChange(Number(e.target.value))}
                    className="no-spin w-16 bg-transparent px-2 py-1.5 text-center outline-none"
                    aria-label={t("timetable.controls.party")}
                  />
                  <button
                    className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                    onClick={() => onPartyChange(partySize + 1)}
                    disabled={loading}
                    aria-label={t("timetable.controls.increase")}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs opacity-60">
          {t("timetable.timezonePrefix")} <strong>{TIMEZONE}</strong>.
        </p>
      </div>

      {/* TITLE */}
      <div className="mx-auto max-w-5xl pt-2 text-center">
        <div className="inline-block">
          <h1
            className="text-2xl md:text-[28px] font-semibold tracking-tight t-anim"
            style={{ animation: "tPulseSoft 6.5s ease-in-out infinite" }}
          >
            <span className="bg-gradient-to-r from-white via-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t("timetable.chooseTime")}
            </span>
          </h1>
        </div>
        <div
          className="mt-2 h-[3px] w-36 mx-auto rounded-full bg-gradient-to-r from-transparent via-amber-400/85 to-transparent"
          style={{ animation: "tGlowLine 3s ease-in-out infinite" }}
        />
        <p className="mt-2 text-sm text-muted-foreground">{pretty}</p>
      </div>

      {/* SLOTS */}
      <section className="grid gap-5">
        {loading && (
          <div className="rounded-2xl border border-[--color-border] p-5">
            <div
              className="h-4 w-40 rounded bg-[linear-gradient(90deg,#1f1f1f,#2a2a2a,#1f1f1f)] bg-[length:200%_100%]"
              style={{ animation: "tShimmer 1.2s ease-in-out infinite" }}
            />
            <div
              className="mt-4 h-12 rounded bg-[linear-gradient(90deg,#1f1f1f,#2a2a2a,#1f1f1f)] bg-[length:200%_100%]"
              style={{ animation: "tShimmer 1.2s ease-in-out infinite" }}
            />
          </div>
        )}

        {!loading && slots.length === 0 && (
          <div className="rounded-2xl border border-[--color-border] p-6 text-sm text-center opacity-80">
            {t("timetable.noSlots")}
          </div>
        )}

        {slots.map((s) => {
          const disabled = !s.canFit;
          const pricePer = (s.pricePerPerson / 100).toFixed(2);
          const total = (s.totalPrice / 100).toFixed(2);
          const start = new Date(s.start);
          const end = new Date(s.end);

          return (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-card] p-5 sm:p-6 transition hover:-translate-y-[2px] hover:shadow-[0_18px_48px_-20px_rgba(255,210,80,0.35)]"
            >
              {/* subtle gradient edge */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(90deg, rgba(147,51,234,.28), rgba(255,210,80,.25), rgba(176,136,248,.28))",
                  padding: 1,
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">
                    {format(start, "HH:mm")}–{format(end, "HH:mm")}
                  </div>
                  <div className="mt-1 text-xs opacity-70">
                    {t("timetable.remaining")}: {s.remaining}
                    {s.remaining <= 3 && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                        <span className="inline-block size-1.5 rounded-full bg-amber-400" />
                        {`${s.remaining} ${t("timetable.left")}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-6 sm:items-center">
                  <div className="text-right">
                    <div className="text-xs opacity-70">
                      €{pricePer} {t("timetable.perPerson")}
                    </div>
                    <div className="text-xl font-semibold">
                      €{total} {t("timetable.total")}
                    </div>
                  </div>

                  <button
                    disabled={disabled || loading}
                    onClick={() => handleChooseSlot(s.id, s.totalPrice)}
                    className={`inline-flex h-11 items-center rounded-[12px] px-5 text-sm font-medium
                      text-white border border-white/10
                      bg-[linear-gradient(90deg,var(--accent-600),var(--accent-500),var(--accent-600))] bg-[length:200%_100%]
                      shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-500),transparent_65%)]
                      ${
                        disabled || loading
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:scale-[1.02] hover:shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--accent-500),transparent_55%)]"
                      }
                      transition-transform duration-300
                    `}
                    style={{
                      backgroundColor:
                        "color-mix(in oklab, var(--accent-500) 95%, black)",
                    }}
                  >
                    {disabled ? t("timetable.notEnough") : t("timetable.choose")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}