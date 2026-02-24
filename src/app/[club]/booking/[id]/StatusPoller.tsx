"use client";
import { useEffect, useState } from "react";

export default function StatusPoller({
  tenantSlug,
  bookingId,
  initialStatus,
}: {
  tenantSlug?: string;
  bookingId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const base = tenantSlug ? `/${tenantSlug}` : "";

  useEffect(() => {
    // Stop polling once terminal
    const s = status.toLowerCase();
    if (s === "paid" || s === "cancelled" || s === "refunded" || s === "confirmed") return;

    let cancelled = false;
    let tries = 0;

    const tick = async () => {
      tries++;
      try {
        const res = await fetch(`${base}/api/bookings/${bookingId}`, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          if (j.status && j.status !== status) setStatus(j.status);
          const low = String(j.status || "").toLowerCase();
          if (["paid", "cancelled", "refunded", "confirmed"].includes(low)) return;
        }
      } catch {}
      if (!cancelled && tries < 30) setTimeout(tick, 2000);
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [base, bookingId, status]);

  const isPaidLike = ["paid", "confirmed"].includes(status.toLowerCase());

  return (
    <span className={`capitalize ${isPaidLike ? "text-green-500" : "text-yellow-500"}`}>
      {status}
    </span>
  );
}
