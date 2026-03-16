import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import ActivitiesClient from "@/components/customer/ActivitiesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const jar = await cookies();
  const lang = jar.get("ui_lang")?.value ?? "en";
  const currency = jar.get("ui_currency")?.value ?? "€";

  const activities = await prisma.activity.findMany({
    where: { active: true, club: { slug: club } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      durationMin: true,
      maxParty: true,
      basePrice: true,
      coverImageUrl: true,
      locationId: true,
    },
  });

  const d = new Date();
  d.setDate(d.getDate() + 1);
  const date = d.toISOString().slice(0, 10);

  return (
    <ActivitiesClient
      tenantSlug={club}
      lang={lang}
      currency={currency}
      date={date}
      activities={activities}
    />
  );
}