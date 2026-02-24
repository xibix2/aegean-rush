// src/components/AdminLogoutButton.tsx
"use client";

export default function AdminLogoutButton({
  tenantSlug,
}: {
  tenantSlug?: string;
}) {
  const onLogout = () => {
    // Use full reload to ensure the session cookie clears and redirects correctly
    const base = tenantSlug ? `/${tenantSlug}` : "";
    window.location.assign(`${base}/api/admin/logout`);
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="
        relative inline-flex items-center justify-center
        rounded-[10px] h-10 px-5 text-sm font-medium text-white
        border border-[--color-border]
        bg-[linear-gradient(135deg,var(--accent-700),var(--accent-500))]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_-8px_color-mix(in_oklab,var(--accent-600),transparent_50%)]
        hover:shadow-[0_8px_24px_-10px_color-mix(in_oklab,var(--accent-500),transparent_45%)]
        hover:scale-[1.02]
        active:scale-[0.98]
        transition-all duration-300 ease-out
      "
      style={{
        backgroundImage:
          "linear-gradient(135deg, color-mix(in_oklab,var(--accent-700),black_10%), color-mix(in_oklab,var(--accent-500),transparent_20%))",
      }}
    >
      Logout
    </button>
  );
}