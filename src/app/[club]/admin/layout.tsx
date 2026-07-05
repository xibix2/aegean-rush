// src/app/[club]/admin/layout.tsx
import type React from "react";
import AdminNavClient from "@/app/admin/_AdminNavClient";
import { requireClubAdmin } from "@/lib/admin-guard";
import { requireTenant } from "@/lib/tenant";

export default async function ClubAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const tenant = await requireTenant(club);
  await requireClubAdmin(tenant.id);

  const basePrefix = `/${club}/admin`;

  return <AdminNavClient basePrefix={basePrefix}>{children}</AdminNavClient>;
}

