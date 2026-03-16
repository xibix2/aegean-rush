// src/app/[club]/availability/page.tsx
import { cookies } from "next/headers";
import { getT } from "@/components/I18nProvider";
import TimetableClient from "@/components/customer/TimetableClient";
import { requireTenant } from "@/lib/tenant";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AvailabilityPage({
  params,
  searchParams,
}: {
  params: { club: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const tenant = await requireTenant(params.club);

  const jar = await cookies();
  const lang = jar.get("ui_lang")?.value ?? "en";
  const currency = jar.get("ui_currency")?.value ?? "€";
  const t = await getT(lang);

  return (
    <TimetableClient
      tenantSlug={tenant.slug}
      searchParams={searchParams}
      t={t}
      currency={currency}
    />
  );
}