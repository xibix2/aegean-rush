"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useT } from "@/components/I18nProvider";

type Sport = "PADEL" | "TENNIS" | "PICKLEBALL";
type MonthDay = { date: string; totalSlots: number; freeSlots: number };
type DaySlot = {
  slotId: string;
  courtName: string;
  startAt: string;
  endAt: string;
  priceCents: number;
  available: boolean;
};
type Court = { id: string; name: string; sport: Sport };

async function safeJson(res: Response) {
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AdminCalendarPage() {
  const t = useT();
  const { club } = useParams<{ club: string }>();

  const [sport, setSport] = useState<Sport>("PADEL");
  const [date, setDate] = useState(todayISO());
  const month = useMemo(() => date.slice(0, 7), [date]);

  const [monthData, setMonthData] = useState<MonthDay[]>([]);
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // tenant-aware API helper
  const api = (p: string) => `/${club}${p}`;

  // courts
  useEffect(() => {
    if (!club) return;
    fetch(api("/api/courts"), { cache: "no-store" })
      .then(safeJson)
      .then((d) => setCourts(Array.isArray(d) ? d : []));
  }, [club]);

  // month heatmap
  useEffect(() => {
    if (!club) return;
    fetch(api(`/api/availability/month?sport=${sport}&month=${month}`), {
      cache: "no-store",
    })
      .then(safeJson)
      .then((d) => setMonthData(Array.isArray(d) ? d : []));
  }, [sport, month, club]);

  // day slots
  useEffect(() => {
    if (!club) return;
    setLoading(true);
    fetch(api(`/api/availability/day?sport=${sport}&date=${date}`), {
      cache: "no-store",
    })
      .then(safeJson)
      .then((d) => setSlots(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [sport, date, club]);

  async function generateSlots(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!club) return;
    setMsg(null);
    const fd = new FormData(e.currentTarget);

    const courtIds = courts
      .filter((c) => fd.getAll("courtIds").includes(c.id))
      .map((c) => c.id);

    if (courtIds.length === 0) {
      const selected: string[] = [];
      document
        .querySelectorAll<HTMLInputElement>('input[name="courtIds"]:checked')
        .forEach((el) => selected.push(el.value));
      courtIds.push(...selected);
    }

    const payload = {
      courtIds,
      from: String(fd.get("from")),
      to: String(fd.get("to")),
      startHour: Number(fd.get("startHour")),
      endHour: Number(fd.get("endHour")),
      durationMin: Number(fd.get("durationMin")),
      priceCents: Math.round(Number(fd.get("price")) * 100),
      capacity: Number(fd.get("capacity") || 1),
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6].filter((dow) =>
        fd.getAll("dows").includes(String(dow))
      ),
    };

    const res = await fetch(api("/api/slots/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    if (res.ok) {
      setMsg(`${t("calendar.msg.created")} ${(data?.created ?? 0)} slots.`);
      setDate((d) => d); // refresh day
    } else {
      setMsg(t("calendar.msg.failed"));
    }
  }

  const freeByDate = Object.fromEntries(monthData.map((d) => [d.date, d.freeSlots]));
  const daysInMonth = makeMonthDays(month);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-accent-gradient">{t("calendar.title")}</span>
        </h1>
        <div className="mx-auto mt-2 h-[3px] w-40 rounded-full accent-line" />
      </header>

      {/* Sport / Month Controls */}
      <section className="rounded-2xl u-border u-surface backdrop-blur-md p-5 space-y-3 glow-soft">
        <div className="flex flex-wrap items-center gap-3">
          {(["PADEL", "TENNIS", "PICKLEBALL"] as Sport[]).map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={[
                "h-10 rounded-full px-4 text-sm font-medium transition",
                sport === s ? "btn-accent text-white" : "u-border u-surface hover:u-surface-2",
              ].join(" ")}
              title={`${t("calendar.sport.switch")} ${String(s)}`}
            >
              {s}
            </button>
          ))}

          <input
            type="month"
            value={month}
            onChange={(e) => {
              const m = e.target.value;
              setDate(m + "-01");
            }}
            className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            aria-label={t("calendar.controls.month")}
          />

          <div className="text-sm opacity-80">{t("calendar.controls.hint")}</div>
        </div>
      </section>

      {/* Month grid */}
      <section className="rounded-2xl u-border u-surface backdrop-blur-md p-5">
        <h3 className="text-lg font-semibold mb-3">{t("calendar.monthOverview")}</h3>
        <div className="grid grid-cols-7 gap-2 text-sm">
          {daysInMonth.map((d) => {
            const free = freeByDate[d] ?? 0;
            const isSelected = d === date;
            const baseColor =
              free === 0
                ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                : free < 5
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={[
                  "rounded-lg border p-2 text-center transition",
                  baseColor,
                  isSelected ? "ring-2 ring-[var(--accent-400)]" : "",
                ].join(" ")}
                title={`${String(free)} ${t("calendar.freeSlots")}`}
              >
                {d.slice(-2)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Day list */}
      <section className="rounded-2xl u-border u-surface backdrop-blur-md p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t("calendar.slotsOn")}{" "}
            <span className="text-accent-gradient">{date}</span>
          </h3>
        </div>

        {loading && (
          <div className="rounded-lg u-border u-surface-2 p-3 text-sm opacity-80">
            {t("calendar.loading")}
          </div>
        )}

        {!loading && slots.length === 0 ? (
          <div className="rounded-lg u-border u-surface-2 p-4 text-sm opacity-80">
            {t("calendar.empty")}
          </div>
        ) : (
          <ul className="space-y-2">
            {slots.map((s) => (
              <li
                key={s.slotId}
                className="flex items-center justify-between rounded-xl u-border u-surface px-4 py-3"
              >
                <div>
                  <div className="font-medium">{s.courtName}</div>
                  <div className="text-xs opacity-75">
                    {new Date(s.startAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}{" "}
                    –{" "}
                    {new Date(s.endAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                </div>
                <div
                  className={`text-xs font-medium ${
                    s.available ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {s.available ? t("calendar.free") : t("calendar.full")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Slot generator */}
      <section className="rounded-2xl u-border u-surface backdrop-blur-md p-5 glow-soft">
        <h3 className="text-lg font-semibold mb-4 text-accent-gradient">
          {t("calendar.generator.title")}
        </h3>

        <form onSubmit={generateSlots} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset className="col-span-full">
            <legend className="mb-1 text-sm font-medium opacity-90">{t("calendar.generator.courts")}</legend>
            <div className="flex flex-wrap gap-3">
              {courts.length === 0 && (
                <div className="text-sm opacity-70">{t("calendar.generator.noCourts")}</div>
              )}
              {courts.map((c) => (
                <label
                  key={c.id}
                  className="inline-flex items-center gap-2 text-sm rounded-full px-3 py-1.5 u-border u-surface hover:u-surface-2 transition"
                >
                  <input type="checkbox" name="courtIds" value={c.id} defaultChecked className="sr-only peer" />
                  <span
                    className="inline-block size-2.5 rounded-full bg-[color-mix(in_oklab,var(--accent-500),transparent_45%)]
                               peer-checked:bg-[var(--accent-500)]
                               peer-checked:shadow-[0_0_10px_2px_rgb(var(--accent-glow)/0.5)] transition"
                  />
                  <span>
                    {c.name} <span className="opacity-70">({c.sport})</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {([
            ["from", t("calendar.generator.from"), "date", date],
            ["to", t("calendar.generator.to"), "date", date],
          ] as const).map(([name, label, type, val]) => (
            <label key={name} className="text-sm">
              <div className="mb-1 opacity-80">{label}</div>
              <input
                name={name}
                type={type}
                defaultValue={val}
                className="w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                required
              />
            </label>
          ))}

          <label className="text-sm">
            <div className="mb-1 opacity-80">{t("calendar.generator.startHour")}</div>
            <input
              name="startHour"
              type="number"
              min={0}
              max={24}
              defaultValue={8}
              className="w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 opacity-80">{t("calendar.generator.endHour")}</div>
            <input
              name="endHour"
              type="number"
              min={0}
              max={24}
              defaultValue={23}
              className="w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 opacity-80">{t("calendar.generator.duration")}</div>
            <input
              name="durationMin"
              type="number"
              min={15}
              step={15}
              defaultValue={60}
              className="w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 opacity-80">{t("calendar.generator.price")}</div>
            <input
              name="price"
              type="number"
              min={0}
              step={0.5}
              defaultValue={20}
              className="w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 opacity-80">{t("calendar.generator.capacity")}</div>
            <input
              name="capacity"
              type="number"
              min={1}
              max={8}
              defaultValue={1}
              className="w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </label>

          <fieldset className="col-span-full">
            <legend className="mb-1 text-sm font-medium opacity-90">{t("calendar.generator.dows")}</legend>
            <div className="flex flex-wrap gap-2 text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((lbl, idx) => (
                <label
                  key={idx}
                  className="relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 u-border u-surface select-none"
                >
                  <input type="checkbox" name="dows" value={idx} defaultChecked className="sr-only peer" />
                  <span
                    className="inline-block size-2.5 rounded-full bg-[color-mix(in_oklab,var(--accent-500),transparent_45%)]
                               peer-checked:bg-[var(--accent-500)]
                               peer-checked:shadow-[0_0_10px_2px_rgb(var(--accent-glow)/0.5)] transition"
                  />
                  <span className="opacity-85">{lbl}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="col-span-full flex items-center gap-3 pt-2">
            <button className="inline-flex items-center justify-center rounded-xl px-6 h-10 text-sm font-medium btn-accent">
              {t("calendar.generator.generate")}
            </button>
            {msg && <span className="text-sm opacity-80">{msg}</span>}
          </div>
        </form>
      </section>
    </main>
  );
}

function makeMonthDays(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const out: string[] = [];
  const curr = new Date(first);
  while (curr.getUTCMonth() === first.getUTCMonth()) {
    out.push(curr.toISOString().slice(0, 10));
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return out;
}