"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { formatMoneyCentsClient } from "@/lib/money-client";
import { readUiPrefsFromDocument } from "@/lib/ui-prefs-client";
import { useT } from "@/components/I18nProvider";

/* ======================= Types bound to /api/bookings ======================= */
type APIRow = {
  id: string;
  status: string;
  partySize: number;
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  startAt: string;
  endAt: string;
  activityName: string;
  createdAt: string;
};

type APIResponse = { tz: string; bookings: APIRow[] };

type Row = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  amountCents: number;
  players: number;
  customerName: string;
  customerEmail: string;
  activityName: string;
  startAt: string;
  endAt: string;
  createdAt: string;
};

const STATUS_ORDER = ["PENDING", "CONFIRMED", "CANCELLED", "REFUNDED"] as const;
type StatusFilter = "ALL" | (typeof STATUS_ORDER)[number];

/* ======================= Helpers ======================= */
function normalizeStatus(s: string | undefined): Row["status"] {
  const up = (s ?? "").toUpperCase();
  if (up === "PAID" || up === "CONFIRMED") return "CONFIRMED";
  if (up === "PENDING") return "PENDING";
  if (up === "CANCELLED" || up === "CANCELED") return "CANCELLED";
  if (up === "REFUNDED") return "REFUNDED";
  return "PENDING";
}

function fmtHM(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const statusKeyToI18n = {
  PENDING: "bookings.filters.pending",
  CONFIRMED: "bookings.filters.confirmed",
  CANCELLED: "bookings.filters.cancelled",
  REFUNDED: "bookings.filters.refunded",
} as const;

/* =============================== Page ================================== */
export default function AdminBookingsPage() {
  const t = useT();
  const { club } = useParams<{ club: string }>();

  const { currency: currencySymbol } = readUiPrefsFromDocument();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const apiPath = (p: string) => `/${club}${p}`;

  useEffect(() => {
    if (!club) return;

    let alive = true;

    (async () => {
      setLoading(true);

      try {
        const res = await fetch(apiPath(`/api/bookings?date=${date}`), {
          cache: "no-store",
        });

        if (!alive) return;

        if (!res.ok) {
          setRows([]);
          return;
        }

        const data: APIResponse = await res.json();

        const mapped: Row[] = (data.bookings || []).map((b) => ({
          id: b.id,
          status: normalizeStatus(b.status),
          amountCents: b.totalPrice ?? 0,
          players: b.partySize ?? 1,
          customerName: b.customerName ?? "",
          customerEmail: b.customerEmail ?? "",
          activityName: b.activityName ?? "",
          startAt: b.startAt,
          endAt: b.endAt,
          createdAt: b.createdAt,
        }));

        setRows(mapped);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [date, club]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      ALL: rows.length,
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };

    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows.slice();

    if (statusFilter !== "ALL") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q) ||
          r.activityName.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const da = +new Date(a.createdAt);
      const db = +new Date(b.createdAt);
      return sortDir === "desc" ? db - da : da - db;
    });

    return list;
  }, [rows, statusFilter, search, sortDir]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const confirmed = filtered.filter((r) => r.status === "CONFIRMED").length;
    const cancelled = filtered.filter((r) => r.status === "CANCELLED").length;
    const revenueCents = filtered
      .filter((r) => r.status === "CONFIRMED")
      .reduce((acc, r) => acc + r.amountCents, 0);

    return { total, confirmed, cancelled, revenueCents };
  }, [filtered]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes adminGlowLine { 0%,100%{opacity:.55; transform:scaleX(.9)} 50%{opacity:.95; transform:scaleX(1)} }
          `,
        }}
      />

      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-accent-gradient">{t("bookings.title")}</span>
        </h1>
        <div
          className="mx-auto mt-2 h-[3px] w-66 ml-86 rounded-full accent-line"
          style={{ animation: "adminGlowLine 3.2s ease-in-out infinite" }}
        />
      </header>

      <section className="rounded-2xl u-border u-surface backdrop-blur-md p-4 sm:p-5 glow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm opacity-85 flex items-center gap-2">
            <span className="whitespace-nowrap">{t("bookings.date")}:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </label>

          <input
            placeholder={t("bookings.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 min-w-[220px] flex-1 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
          />

          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            title={sortDir === "desc" ? t("bookings.sortNewest") : t("bookings.sortOldest")}
            className="h-10 rounded-lg u-border u-surface px-3 text-sm transition hover:u-surface-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
          >
            {sortDir === "desc" ? t("bookings.sortNewest") : t("bookings.sortOldest")}
          </button>

          <button
            onClick={() => setDate((d) => d)}
            disabled={loading}
            className="h-10 rounded-xl px-4 text-sm font-medium btn-accent disabled:opacity-60"
          >
            {loading ? "Loading…" : t("bookings.refresh")}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Pill active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
            {t("bookings.filters.all")} <Badge>{counts.ALL}</Badge>
          </Pill>

          {STATUS_ORDER.map((s) => (
            <Pill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {t(statusKeyToI18n[s])} <Badge>{counts[s]}</Badge>
            </Pill>
          ))}
        </div>
      </section>

      <section className="relative rounded-2xl u-border u-surface backdrop-blur-md px-6 py-5 flex flex-wrap items-center justify-between overflow-hidden glow-soft">
        <div className="flex flex-wrap items-center gap-5 text-[0.95rem] font-medium">
          <div className="flex items-baseline gap-2">
            <span className="text-sm opacity-70">{t("bookings.summary.bookings")}</span>
            <span className="text-lg font-semibold">{summary.total}</span>
          </div>

          <div className="h-5 w-[1px] bg-white/10 mx-1 rounded-full" />

          <div className="flex items-baseline gap-2">
            <span className="text-sm opacity-70">{t("bookings.summary.confirmed")}</span>
            <span className="text-lg font-semibold text-emerald-300">
              {summary.confirmed}
            </span>
          </div>

          <div className="h-5 w-[1px] bg-white/10 mx-1 rounded-full" />

          <div className="flex items-baseline gap-2">
            <span className="text-sm opacity-70">{t("bookings.summary.cancelled")}</span>
            <span className="text-lg font-semibold text-rose-300">
              {summary.cancelled}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[1.05rem] font-semibold tracking-tight">
          <span className="opacity-75">{t("bookings.summary.revenue")}</span>
          <span className="text-accent-gradient">
            {mounted
              ? formatMoneyCentsClient(summary.revenueCents, {
                  currency: currencySymbol,
                })
              : ""}
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl u-border u-surface backdrop-blur-md glow-soft">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <colgroup>
              <col />
              <col style={{ width: "10%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "5%" }} />
            </colgroup>

            <thead className="sticky top-0 z-10 sticky-head">
              <tr>
                <Th>{t("bookings.table.created")}</Th>
                <Th>{t("bookings.table.status")}</Th>
                <Th>{t("bookings.table.activity")}</Th>
                <Th>{t("bookings.table.time")}</Th>
                <Th>{t("bookings.table.name")}</Th>
                <Th>{t("bookings.table.email")}</Th>
                <Th className="text-center">{t("bookings.table.players")}</Th>
                <Th className="text-right pr-3">{mounted ? currencySymbol : "\u00A0"}</Th>
              </tr>
            </thead>

            <tbody className="transition-opacity">
              {filtered.map((r) => (
                <tr key={r.id} className="border-t u-border hover:u-surface-2 transition">
                  <Td className="whitespace-nowrap opacity-90">
                    {new Date(r.createdAt).toLocaleString("en-GB", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </Td>

                  <Td>
                    <StatusPill status={r.status} label={t(statusKeyToI18n[r.status])} />
                  </Td>

                  <Td>
                    <span className="truncate block" title={r.activityName}>
                      {r.activityName || "—"}
                    </span>
                  </Td>

                  <Td className="whitespace-nowrap">
                    {fmtHM(r.startAt)}–{fmtHM(r.endAt)}
                  </Td>

                  <Td>
                    <span className="block break-words" title={r.customerName}>
                      {r.customerName || "—"}
                    </span>
                  </Td>

                  <Td>
                    <span className="block truncate" title={r.customerEmail}>
                      {r.customerEmail || "—"}
                    </span>
                  </Td>

                  <Td className="text-center">{r.players}</Td>
                  <Td className="text-right pr-3">
                    {mounted
                      ? formatMoneyCentsClient(r.amountCents, {
                          currency: currencySymbol,
                        })
                      : ""}
                  </Td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center opacity-70">
                    {t("bookings.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* ====================== Presentational helpers ======================== */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 inline-flex min-w-[1.5rem] items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[11px]">
      {children}
    </span>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${
        active ? "pill-active" : "u-border u-surface-2 hover:u-surface"
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status, label }: { status: Row["status"]; label: string }) {
  const cls =
    status === "CONFIRMED"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : status === "PENDING"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : status === "CANCELLED"
      ? "border-zinc-400/30 bg-zinc-400/10 text-zinc-200"
      : "border-rose-400/30 bg-rose-400/10 text-rose-200";

  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function Th({
  children,
  className = "",
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      className={`px-3 py-2.5 text-left font-medium opacity-85 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...rest}
      className={`px-3 py-2.5 align-top ${className}`}
    >
      {children}
    </td>
  );
}