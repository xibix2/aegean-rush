// src/app/admin/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { getAdminSession } from "@/lib/auth";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Superadmin - Aegean Rush Admin",
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSuperAdmin();
    return <>{children}</>;
  } catch {
    const session = await getAdminSession();
    const jar = await cookies();
    const tenant = jar.get("tenant_slug")?.value;

    if (session?.role === "ADMIN" && tenant) {
      redirect(`/${tenant}/admin`);
    }

    redirect("/login");
  }
}
