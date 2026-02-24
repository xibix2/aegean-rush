// AdminBookingsClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { readUiPrefsFromDocument } from "@/lib/ui-prefs-client";

type Row = {
  id: string;
  ref: string;
  status: string;
  partySize: number;
  totalPrice: number; // cents
  customerName: string;
  customerEmail: string;
  startAt: string | null;
  endAt: string | null;
  activityName: string;
  createdAt: string;
  paymentStatus: string | null;
  paymentAmountCents: number | null;
};

type Props = {
  /** When present, fetches from /{tenantSlug}/api/... and also sends x-tenant-slug header */
  tenantSlug?: string;
};

// Map UI currency symbol -> ISO code for Intl
const SYMBOL_TO_CODE: Record<string, "EUR" | "USD" | "GBP"> = {
  "€": "EUR",
  "$": "USD",
  "£": "GBP",
};

function makeMoneyFormatter(symbol: string) {
  const code = SYMBOL_TO_CODE[symbol] ?? "EUR";
  return (cents: number | null | undefined) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format((cents ?? 0) / 100);
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const color =
    s === "paid" || s === "confirmed"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/30"
      : s === "pending"
      ? "bg-amber-500/15 text-amber-200 border-amber-400/30"
      : s === "cancelled" || s === "canceled"
      ? "bg-rose-500/15 text-rose-200 border-rose-400/30"
      : s === "refunded"
      ? "bg-zinc-500/15 text-zinc-200 border-zinc-400/30"
      : "bg-zinc-500/15 text-zinc-200 border-zinc-400/30";
  return <span className={`px-2 py-0.5 rounded-md text-xs border capitalize ${color}`}>{s}</span>;
}

export default function AdminBookingsClient({ tenantSlug }: Props) {
  // Base path for tenant-aware fetches
  const base = tenantSlug ? `/${tenantSlug}` : "";

  const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };

  const [date, setDate] = useState(todayISO);
  const [tz, setTz] = useState<string>("Europe/Athens");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  // Read UI currency symbol from cookie (client-only)
  const [currencySymbol, setCurrencySymbol] = useState<string>("€");
  const money = useMemo(() => makeMoneyFormatter(currencySymbol), [currencySymbol]);

  useEffect(() => {
    const prefs = readUiPrefsFromDocument();
    if (prefs?.currency) setCurrencySymbol(prefs.currency);
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = (forDate: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    fetch(`${base}/api/admin/bookings?date=${encodeURIComponent(forDate)}`, {
      cache: "no-store",
      headers: tenantSlug ? { "x-tenant-slug": tenantSlug } : undefined,
      signal: ac.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((json) => {
        setTz(json.tz || tz);
        setRows(Array.isArray(json.bookings) ? (json.bookings as Row[]) : []);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return; // ignore
        setRows([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(date);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, tenantSlug]); // re-run if tenant changes

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") {
      const want = statusFilter.toLowerCase();
      list = list.filter((r) => r.status?.toLowerCase() === want);
    }
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.ref.toLowerCase().includes(s) ||
          r.customerName.toLowerCase().includes(s) ||
          r.customerEmail.toLowerCase().includes(s) ||
          r.activityName.toLowerCase().includes(s)
      );
    }
    return list;
  }, [rows, statusFilter, q]);

  const refresh = () => fetchData(date);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 rounded-md border border-[--color-border] bg-transparent px-2 py-1"
          />
        </label>

        <label className="text-sm">
          Status:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 rounded-md border border-[--color-border] bg-transparent px-2 py-1"
          >
            <option value="all">All</option>
            <option value="paid">paid</option>
            <option value="pending">pending</option>
            <option value="cancelled">cancelled</option>
            <option value="refunded">refunded</option>
          </select>
        </label>

        <input
          placeholder="Search (ref, name, email, activity)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[220px] rounded-md border border-[--color-border] bg-transparent px-3 py-1"
        />

        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-md border border-[--color-border] bg-[--color-card] px-3 py-1 text-sm disabled:opacity-60"
          title="Refresh"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[--color-border]">
        <table className="w-full text-sm">
          <thead className="bg-[--color-card]">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left border-b border-[--color-border]">
              <th>Created</th>
              <th>Ref</th>
              <th>Status</th>
              <th>Activity</th>
              <th>Time</th>
              <th>Name</th>
              <th>Email</th>
              <th>Players</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-[--color-border]">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center opacity-70">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center opacity-70">
                  No bookings for this day.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const created = formatInTimeZone(new Date(r.createdAt), tz, "dd/MM/yyyy, HH:mm");
                const time =
                  r.startAt && r.endAt
                    ? `${formatInTimeZone(new Date(r.startAt), tz, "HH:mm")}–${formatInTimeZone(
                        new Date(r.endAt),
                        tz,
                        "HH:mm"
                      )}`
                    : "—";
                return (
                  <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2">
                    <td className="whitespace-nowrap">{created}</td>
                    <td className="font-mono text-xs">{r.ref}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.activityName}</td>
                    <td className="whitespace-nowrap">{time}</td>
                    <td>{r.customerName || "—"}</td>
                    <td className="opacity-80">{r.customerEmail || "—"}</td>
                    <td className="text-center">{r.partySize}</td>
                    <td className="text-right">{money(r.totalPrice)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}