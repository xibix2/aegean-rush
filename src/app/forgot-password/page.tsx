"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !email) return;
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // We always show success (don’t leak whether an account exists)
      if (!res.ok) {
        // optional: log/debug response
      }
      setSent(true);
    } catch {
      // Ignore network errors purposely for privacy; still show success box
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100svh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-accent-gradient">Forgot password</span>
        </h1>
        <p className="opacity-70 mt-2 text-sm">
          Enter your email and we’ll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl u-border u-surface p-5">
            <h3 className="text-lg font-semibold mb-1">Check your email</h3>
            <p className="text-sm opacity-85">
              If an account exists for <b>{email}</b>, we’ve sent a link to reset your
              password. The link expires in 30 minutes.
            </p>
            <a href="/login" className="inline-block mt-4 text-sm opacity-90 hover:opacity-100">
              Back to sign in
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl u-border u-surface p-5">
            <label className="block text-sm">
              <span className="opacity-80">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full h-11 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            {err && (
              <div className="rounded-md border border-rose-400/30 bg-rose-400/10 text-rose-200 px-3 py-2 text-sm">
                {err}
              </div>
            )}
            <button
              className="btn-accent h-11 rounded-xl px-5 text-sm font-medium"
              disabled={loading || !email}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}