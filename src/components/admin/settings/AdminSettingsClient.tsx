// src/components/admin/settings/AdminSettingsClient.tsx
"use client";

import { useT } from "@/components/I18nProvider";
import React, { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import CoverPicker from "@/components/ui/CoverPicker";

type Props = {
  saved: boolean;
  currentTz: string;
  theme: string;
  accent: string;
  lang: string;
  currency: string;
  compact: boolean;
  sessionHrs: string;
  tzOptions: readonly string[];
  action: (formData: FormData) => Promise<void>;
  // branding
  primaryHex: string;
  emailFromName: string;
  emailFromEmail: string;
  subscriptionPlan: string; // "BASIC" | "PRO" | "ENTERPRISE"
};

// pull tenant from /{slug}/admin/...
function extractTenantSlug(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length > 0 && parts[1] === "admin") return parts[0];
  return null;
}

export default function AdminSettingsClient({
  saved,
  currentTz,
  theme,
  accent,
  lang,
  currency,
  compact,
  sessionHrs,
  tzOptions,
  action,
  primaryHex,
  emailFromName,
  emailFromEmail,
  subscriptionPlan,
}: Props) {
  const t = useT();
  const pathname = usePathname();
  const tenant = extractTenantSlug(pathname || "");
  const prefix = tenant ? `/${tenant}` : "";

  const plan = subscriptionPlan;
  const isBasic = plan === "BASIC";
  const isPro = plan === "PRO";
  const isEnterprise = plan === "ENTERPRISE";

  const planLabel = isEnterprise ? "Enterprise" : isPro ? "Pro" : "Basic";

  // Plan gates
  const canChangeLanguage = !isBasic; // PRO + ENTERPRISE
  const canUseEnterpriseBranding = isEnterprise; // logo + email customization

  // Local state for primary hex so we can sync text + color picker
  const [hex, setHex] = useState(primaryHex || "");
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  // For the preview, we want *some* valid hex even if field is empty
  const previewHex =
    hex && hex.trim()
      ? hex.trim().startsWith("#")
        ? hex.trim()
        : `#${hex.trim()}`
      : "#ec4899"; // default preview color

  const handleHexChange = (value: string) => {
    if (!isEnterprise) return;
    setHex(value);
  };

  const handleColorChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!isEnterprise) return;
    setHex(e.target.value);
  };

  const openColorPicker = () => {
    if (!isEnterprise) return;
    colorInputRef.current?.click();
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl ml-3 font-semibold tracking-tight">
            <span className="text-accent-gradient">{t("settings.title")}</span>
          </h1>
          <div
            className="h-[3px] w-35 rounded-full accent-line mt-2"
            style={{
              animation: "adminGlowLine 3.2s ease-in-out infinite",
            } as any}
          />
          <p className="mt-2 text-sm opacity-70">{t("settings.subtitle")}</p>
          <p className="mt-1 text-xs opacity-60">
            Plan: <span className="font-medium">{planLabel}</span>
          </p>
        </div>

        {/* Logout via GET -> API sends 303 to the right /{slug}/admin/login */}
        <form method="get" action="/api/admin/logout">
          <button
            type="submit"
            className={`
              relative inline-flex items-center justify-center
              rounded-[10px] h-10 px-5 text-sm font-medium text-white
              border border-[--color-border]
              bg-[linear-gradient(135deg,var(--accent-700),var(--accent-500))]
              shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_-8px_color-mix(in_oklab,var(--accent-600),transparent_50%)]
              hover:shadow-[0_8px_24px_-10px_color-mix(in_oklab,var(--accent-500),transparent_45%)]
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-300 ease-out
            `}
            style={{
              backgroundImage:
                "linear-gradient(135deg, color-mix(in_oklab,var(--accent-700),black_10%), color-mix(in_oklab,var(--accent-500),transparent_20%))",
            }}
          >
            Logout
          </button>
        </form>
      </header>

      {/* Saved banner */}
      {saved && (
        <div
          className="rounded-xl border border-[color-mix(in_oklab,var(--accent-400),transparent_45%)] px-4 py-2 text-sm"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--accent-500), transparent 90%), color-mix(in oklab, var(--accent-600), transparent 92%))",
            boxShadow:
              "0 10px 24px -18px color-mix(in oklab, var(--accent-600), transparent 82%), inset 0 1px 0 rgba(255,255,255,.05)",
          }}
        >
          {t("settings.saved")}
        </div>
      )}

      <form
        action={action}
        className="space-y-8 rounded-2xl u-border u-surface backdrop-blur-md p-6 shadow-[0_0_40px_-20px_color-mix(in_oklab,var(--accent-600),transparent_75%)]"
        style={{ ["--card" as any]: "rgba(20,20,30,.55)" }}
      >
        {/* App Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium opacity-90">{t("settings.app")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="opacity-80">{t("settings.timezone")}</span>
              <select
                name="tz"
                defaultValue={currentTz}
                className="mt-1 w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              >
                {tzOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="opacity-80">
                {t("settings.language")}{" "}
                {!canChangeLanguage && (
                  <span className="text-[10px] ml-1 opacity-60">
                    (Pro/Enterprise only)
                  </span>
                )}
              </span>
              <select
                name="lang"
                defaultValue={lang}
                disabled={!canChangeLanguage}
                className="mt-1 w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="en">English</option>
                <option value="el">Greek</option>
                <option value="fr">French</option>
              </select>
              {!canChangeLanguage && (
                <small className="block mt-1 text-[11px] opacity-60">
                  Upgrade to Pro or Enterprise to change your public site language.
                </small>
              )}
            </label>

            <label className="text-sm">
              <span className="opacity-80">{t("settings.currency")}</span>
              <select
                name="currency"
                defaultValue={currency}
                className="mt-1 w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              >
                <option value="€">€ Euro</option>
                <option value="$">$ USD</option>
                <option value="£">£ GBP</option>
              </select>
            </label>
          </div>
        </section>

        {/* Interface */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium opacity-90">
            {t("settings.interface")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="text-sm">
              <span className="opacity-80">{t("settings.theme")}</span>
              <select
                name="theme"
                defaultValue={theme}
                className="mt-1 w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              >
                <option value="dark">{t("settings.theme.dark")}</option>
                <option value="light">{t("settings.theme.light")}</option>
                <option value="auto">{t("settings.theme.auto")}</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="opacity-80">
                {t("settings.accent")}{" "}
                {isBasic && (
                  <span className="text-[10px] ml-1 opacity-60">
                    (Basic plan locked to pink)
                  </span>
                )}
              </span>
              <select
                name="accent"
                defaultValue={accent}
                disabled={isBasic}
                className="mt-1 w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="pink">Pink</option>
                <option value="blue">Blue</option>
                <option value="emerald">Emerald</option>
              </select>
            </label>

            <label className="text-sm inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="compact"
                defaultChecked={compact}
                className="size-4 rounded border-white/20 bg-white/5"
              />
              <span className="opacity-80">{t("settings.compact")}</span>
            </label>
          </div>
        </section>

        {/* Branding */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium opacity-90">Branding</h2>
          <p className="text-xs opacity-70 max-w-md">
            Set your business brand color, logo and email identity. These will be
            used across your public site and outgoing emails.
          </p>

          {/* Enterprise note */}
          {!isEnterprise && (
            <p className="text-[11px] opacity-60">
              Branding customization is available on the{" "}
              <span className="font-medium">Enterprise</span> plan.
            </p>
          )}

          {/* Brand color card (hex = Enterprise only, already correct) */}
          <div className="rounded-xl u-border u-surface px-4 py-3 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Live preview tile */}
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border border-white/10 shadow-sm shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklab, " +
                    previewHex +
                    " 82%, black 8%), " +
                    previewHex +
                    ")",
                }}
              />
              <div className="text-xs opacity-75">
                <div className="font-medium opacity-90">Brand color</div>
                <div className="opacity-60">
                  Used in the navbar glow, logo badge and other accents.
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-center">
              <div className="flex-1 min-w-[160px]">
                <input
                  name="primaryHex"
                  value={hex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#ec4899"
                  disabled={!isEnterprise}
                  className="w-full h-10 rounded-lg u-border u-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <input
                ref={colorInputRef}
                type="color"
                value={previewHex}
                onChange={handleColorChange}
                disabled={!isEnterprise}
                className="hidden"
              />

              <button
                type="button"
                onClick={openColorPicker}
                disabled={!isEnterprise}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3 h-10 text-xs font-medium uppercase tracking-wide bg-white/5 hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isEnterprise ? "Pick color" : "Enterprise only"}
              </button>
            </div>
          </div>

          {/* Email identity (Enterprise only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <label className="text-sm">
              <span className="opacity-80">
                Email sender name{" "}
                {!canUseEnterpriseBranding && (
                  <span className="text-[10px] ml-1 opacity-60">
                    (Enterprise only)
                  </span>
                )}
              </span>
              <input
                name="emailFromName"
                defaultValue={emailFromName}
                placeholder="e.g., Aegean Rush Watersports"
                disabled={!canUseEnterpriseBranding}
                className="mt-1 w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </label>

            <label className="text-sm">
              <span className="opacity-80">
                Email sender address{" "}
                {!canUseEnterpriseBranding && (
                  <span className="text-[10px] ml-1 opacity-60">
                    (Enterprise only)
                  </span>
                )}
              </span>
              <input
                name="emailFromEmail"
                type="email"
                defaultValue={emailFromEmail}
                placeholder="bookings@yourbusiness.com"
                disabled={!canUseEnterpriseBranding}
                className="mt-1 w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </label>
          </div>

          {!canUseEnterpriseBranding && (
            <p className="text-[11px] opacity-60">
              Upgrade to <span className="font-medium">Enterprise</span> to use a
              custom sender name/address and upload your logo.
            </p>
          )}

          {/* Business logo upload (Enterprise only now) */}
          <div className="mt-2">
            <span className="block text-sm opacity-80 mb-2">
              Business logo{" "}
              {!canUseEnterpriseBranding && (
                <span className="text-[10px] ml-1 opacity-60">
                  (Enterprise only)
                </span>
              )}
            </span>

            <div
              className={!canUseEnterpriseBranding ? "opacity-60 pointer-events-none" : ""}
              aria-disabled={!canUseEnterpriseBranding}
            >
              <CoverPicker name="logoFile" size={160} />
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium opacity-90">
            {t("settings.security")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="text-sm">
              <span className="opacity-80">{t("settings.session")}</span>
              <select
                name="session"
                defaultValue={sessionHrs}
                className="mt-1 w-full h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              >
                <option value="8">8 {t("settings.hours")}</option>
                <option value="24">24 {t("settings.hours")}</option>
                <option value="168">7 {t("settings.days")}</option>
              </select>
            </label>

            <div className="text-sm">
              <span className="opacity-80 block mb-1">
                {t("settings.password")}
              </span>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl u-border u-surface px-4 py-2 text-sm hover:u-surface-2"
                title="Wire this to a modal/route to change the admin password"
              >
                {t("settings.changePassword")}
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[--color-border]">
          <a
            href={`${prefix}/admin`}
            className="text-sm opacity-80 hover:opacity-100 underline underline-offset-4"
          >
            ← {t("settings.back")}
          </a>
          <button className="inline-flex items-center justify-center rounded-xl btn-accent px-6 h-10 text-sm font-medium">
            {t("settings.save")}
          </button>
        </div>
      </form>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes adminGlowLine{0%,100%{opacity:.55;transform:scaleX(.9)}50%{opacity:.95;transform:scaleX(1)}}
          `,
        }}
      />
    </main>
  );
}