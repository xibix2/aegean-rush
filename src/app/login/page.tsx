// src/app/login/page.tsx
"use client";

import { useState, useMemo, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const TXT = {
    title: "Admin Sign In",
    subtitle: "Log in to manage your club.",
    username: "Email",
    password: "Password",
    showPw: "Show password",
    hidePw: "Hide password",
    show: "Show",
    hide: "Hide",
    remember: "Remember me",
    forgot: "Forgot password?",
    signingIn: "Signing in…",
    signIn: "Sign in",
    errInvalid: "Invalid username or password",
    errNetwork: "Network error",
    backMain: "Back to main site",
    backClub: "Back to club page",
    secure: "Secure admin access",
  };

  const params = useSearchParams();
  const tenantParam = params.get("tenant") || "";
  const nextParam = params.get("next") || "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0,
    [username, password]
  );

  function sanitizeNext(n: string): string | null {
    if (!n) return null;
    if (n.startsWith("http://") || n.startsWith("https://") || n.startsWith("//")) return null;
    if (!n.startsWith("/")) return null;
    if (n.startsWith("/admin") || /^\/[^/]+\/admin/.test(n) || n === "/") return n;
    return "/admin";
  }

  function withTenantIfNeeded(target: string, slug: string | null): string {
    if (!slug) return target;
    return target.startsWith("/admin") ? `/${slug}${target}` : target;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      const url = `/api/admin/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`;

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          remember,
          tenant: tenantParam || undefined,
        }),
      });

      let j: any = null;
      try { j = await res.json(); } catch {}

      if (!res.ok) {
        setError(j?.error ?? TXT.errInvalid);
        setLoading(false);
        return;
      }

      const tenantSlug: string | null =
        (typeof j?.tenant === "string" && j.tenant) ||
        (tenantParam || "").trim() ||
        null;

      const safeNext = sanitizeNext(nextParam);
      if (safeNext) {
        window.location.assign(withTenantIfNeeded(safeNext, tenantSlug));
        return;
      }

      if (j?.redirect && typeof j.redirect === "string") {
        window.location.assign(withTenantIfNeeded(j.redirect, tenantSlug));
        return;
      }

      if (tenantSlug) {
        window.location.assign(`/${tenantSlug}/admin`);
      } else {
        window.location.assign("/admin");
      }
    } catch {
      setError(TXT.errNetwork);
      setLoading(false);
    }
  }

  const clubHref = tenantParam ? `/${tenantParam}` : null;

  return (
    <main
      className="min-h-[100svh] grid place-items-center px-6 py-10"
      style={{
        ["--accent-700" as any]: "#a21caf",
        ["--accent-600" as any]: "#db2777",
        ["--accent-500" as any]: "#ec4899",
        ["--accent-400" as any]: "#f472b6",
        ["--accent-300" as any]: "#f9a8d4",
        ["--accent-glow" as any]: "244 114 182",
      }}
    >
      {/* Calm premium background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 50% -10%, color-mix(in oklab, var(--accent-600), transparent 86%), transparent 65%)," +
              "radial-gradient(700px 420px at 10% 20%, rgba(255,255,255,0.04), transparent 60%)," +
              "radial-gradient(700px 420px at 90% 70%, rgba(255,255,255,0.03), transparent 60%)," +
              "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.65))",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='3' cy='3' r='1' fill='%23ffffff' fill-opacity='0.30'/%3E%3Ccircle cx='27' cy='18' r='1' fill='%23ffffff' fill-opacity='0.22'/%3E%3Ccircle cx='18' cy='36' r='1' fill='%23ffffff' fill-opacity='0.18'/%3E%3C/svg%3E\")",
            animation: "loginTwinkle 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-1/2 top-[-140px] h-[520px] w-[860px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--accent-500), transparent 30%), transparent 70%)",
            animation: "loginFloat 10s ease-in-out infinite",
          }}
        />
      </div>

      <div className="w-full max-w-[440px]">
        {/* Top row */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs u-border u-surface/70 backdrop-blur hover:u-surface-2 transition"
            title={TXT.backMain}
          >
            <span aria-hidden>←</span>
            {TXT.backMain}
          </Link>

          {clubHref ? (
            <Link
              href={clubHref}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs u-border u-surface/70 backdrop-blur hover:u-surface-2 transition"
              title={TXT.backClub}
            >
              {TXT.backClub} <span aria-hidden>↗</span>
            </Link>
          ) : (
            <span className="text-xs opacity-70">{TXT.secure}</span>
          )}
        </div>

        {/* Card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_30px_90px_-60px_rgba(0,0,0,0.85)]">
          {/* subtle top accent */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent-500), white 12%), transparent)",
              opacity: 0.9,
            }}
          />

          <div className="p-7 sm:p-8">
            {/* Header */}
            <header className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] opacity-80">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--accent-400), white 12%) 0%, var(--accent-600) 70%)",
                    boxShadow:
                      "0 0 16px 2px color-mix(in oklab, var(--accent-500), transparent 55%)",
                  }}
                />
                {TXT.secure}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                <span className="text-accent-gradient">{TXT.title}</span>
              </h1>

              <p className="mt-2 text-sm opacity-70">{TXT.subtitle}</p>

              {tenantParam && (
                <p className="mt-2 text-xs opacity-70">
                  Club: <span className="opacity-100 font-medium">{tenantParam}</span>
                </p>
              )}

              <div
                className="mx-auto mt-4 h-[3px] w-24 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--accent-500), transparent)",
                  animation: "adminGlowLine 3.2s ease-in-out infinite",
                  opacity: 0.85,
                }}
              />
            </header>

            {/* Helper row */}
            <div className="mt-6 flex items-center justify-between text-xs opacity-70">
              <span>Use your club admin email & password.</span>
              <a href="/forgot-password" className="hover:opacity-100">
                {TXT.forgot}
              </a>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="mt-5 space-y-4" autoComplete="on" noValidate>
              <label htmlFor="username" className="block text-sm">
                <span className="opacity-80">{TXT.username}</span>
                <input
                  id="username"
                  name="username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="username"
                  className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/25 px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                  aria-invalid={!!error}
                />
              </label>

              <label htmlFor="password" className="block text-sm">
                <span className="opacity-80">{TXT.password}</span>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full h-11 rounded-xl border border-white/10 bg-black/25 px-3 pr-20 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                    aria-invalid={!!error}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-xs opacity-85 hover:bg-white/[0.07] transition"
                    aria-label={showPw ? TXT.hidePw : TXT.showPw}
                    title={showPw ? TXT.hidePw : TXT.showPw}
                  >
                    {showPw ? TXT.hide : TXT.show}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-sm opacity-85">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-[--color-border] bg-[--color-card]"
                  />
                  {TXT.remember}
                </label>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-400/30 bg-rose-400/10 text-rose-200 px-3 py-2 text-sm"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full inline-flex items-center justify-center rounded-2xl h-11 text-sm font-medium btn-accent disabled:opacity-60"
              >
                {loading ? TXT.signingIn : TXT.signIn}
              </button>

              <div className="pt-2 flex items-center justify-between text-[11px] opacity-60">
                <span>Powered by TennisPro</span>
                <span className="opacity-70">Admin portal</span>
              </div>
            </form>
          </div>
        </section>

        <style
          dangerouslySetInnerHTML={{
            __html: `
@keyframes adminGlowLine {
  0%,100% { opacity: .45; transform: scaleX(.92); }
  50% { opacity: .95; transform: scaleX(1); }
}
@keyframes loginTwinkle {
  0%,100% { opacity: .04; }
  50% { opacity: .08; }
}
@keyframes loginFloat {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(10px); }
}
          `,
          }}
        />
      </div>
    </main>
  );
}