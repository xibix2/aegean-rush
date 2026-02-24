"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";
  const tenant = searchParams.get("tenant") ?? "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasToken = !!token;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasToken || loading) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tenant, newPassword: password }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error || "Reset failed. Your link may be invalid or expired.";
        setError(msg);
        alert("Reset failed. Your link may be invalid or expired.");
        setLoading(false);
        return;
      }

      alert("Password changed successfully. You can now sign in.");
      // Go back to the normal login page
      router.push("/login");
    } catch (err) {
      console.error("[reset-password] client error", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100svh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl u-border u-surface p-6 glow-soft">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          <span className="text-accent-gradient">Reset password</span>
        </h1>
        <p className="text-sm opacity-75 mb-4">
          Enter a new password (at least 8 characters).
        </p>

        {!hasToken && (
          <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-100 px-3 py-2 text-sm mb-4">
            Missing token. Please use the link from your email.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-400/40 bg-rose-400/10 text-rose-100 px-3 py-2 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="opacity-80">New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full h-11 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              disabled={!hasToken || loading}
            />
          </label>

          <button
            type="submit"
            disabled={!hasToken || loading}
            className="w-full inline-flex items-center justify-center rounded-xl h-11 text-sm font-medium btn-accent disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save new password"}
          </button>
        </form>
      </div>
    </main>
  );
}