// src/app/admin/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/admin-guard";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Superadmin — Aegean Rush Admin",
};

export default async function SuperAdminLayout({
  children,
}: { children: React.ReactNode }) {
  try {
    await requireSuperAdmin(); // throws if not SUPERADMIN
    return <>{children}</>;
  } catch {
    // Not superadmin — figure out best redirect
    const jar = await cookies();
    const role = jar.get("admin_role")?.value;
    const tenant = jar.get("tenant_slug")?.value;

    if (role === "ADMIN" && tenant) {
      redirect(`/${tenant}/admin`);
    }

    redirect("/login");
  }
}