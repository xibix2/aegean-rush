// src/app/[club]/admin/layout.tsx
import type React from "react";
import AdminNavClient from "@/app/admin/_AdminNavClient";

export default async function ClubAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const basePrefix = `/${club}/admin`;

  return <AdminNavClient basePrefix={basePrefix}>{children}</AdminNavClient>;
}

