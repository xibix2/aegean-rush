// src/app/admin/clubs/page.tsx
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { format } from "date-fns";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// ✅ Make sure this page (and the server action) run in Node.js, not edge
export const runtime = "nodejs";

/** 🔥 HARD DELETE everything for a business/operator (server action) */
async function deleteClub(formData: FormData) {
  "use server";

  // We wrap everything in try/catch so one failure doesn't crash the whole page
  try {
    await requireSuperAdmin();

    const clubId = String(formData.get("clubId") || "");
    if (!clubId) {
      console.error("[deleteClub] Missing clubId in formData");
      return;
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, slug: true, name: true },
    });

    if (!club) {
      console.warn("[deleteClub] Club not found for id:", clubId);
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 🔹 Staff invites for this club
      await tx.staffInvite.deleteMany({
        where: { clubId: club.id },
      });

      // 🔹 Payments linked to bookings for this club
      await tx.payment.deleteMany({
        where: { booking: { timeSlot: { activity: { clubId: club.id } } } },
      });

      // 🔹 Bookings
      await tx.booking.deleteMany({
        where: { timeSlot: { activity: { clubId: club.id } } },
      });

      // 🔹 Time slots
      await tx.timeSlot.deleteMany({
        where: { activity: { clubId: club.id } },
      });

      // 🔹 Activities
      await tx.activity.deleteMany({
        where: { clubId: club.id },
      });

      // 🔹 Customers
      await tx.customer.deleteMany({
        where: { clubId: club.id },
      });

      // 🔹 Users bound to this club
      await tx.user.deleteMany({
        where: { clubId: club.id },
      });

      // 🔹 App settings for this club
      await tx.appSetting.deleteMany({
        where: { clubId: club.id },
      });

      // 🔹 Finally the club itself
      await tx.club.delete({
        where: { id: club.id },
      });
    });

    revalidatePath("/admin/clubs");
  } catch (err) {
    console.error("[deleteClub] Hard-delete failed:", err);
    // Don't rethrow – we log it, but we don't crash the whole page
  }
}

function PlanBadge({ plan }: { plan: string }) {
  const label =
    plan === "PRO" ? "Pro" : plan === "ENTERPRISE" ? "Enterprise" : "Basic";
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border border-[--color-border] bg-[--surface-2]">
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  let text = status.toLowerCase().replace("_", " ");
  text = text.charAt(0).toUpperCase() + text.slice(1);

  const color =
    status === "ACTIVE"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : status === "TRIALING"
      ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
      : status === "PAST_DUE"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
      : status === "CANCELED"
      ? "bg-rose-500/10 text-rose-300 border-rose-500/40"
      : "bg-zinc-500/10 text-zinc-300 border-zinc-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${color}`}
    >
      {text}
    </span>
  );
}

export default async function AdminClubsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  await requireSuperAdmin();

  const q = (typeof searchParams?.q === "string" ? searchParams.q : "").trim();

  const where =
    q.length > 0
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined;

  const clubs = await prisma.club.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-accent-gradient">Businesses</span>
          </h1>
          <p className="mt-1 text-sm opacity-70">
            Search operators, open their admin dashboards, or permanently remove them.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form className="relative">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search business name or slug..."
              className="h-10 w-64 sm:w-72 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </form>
          <Link
            href="/admin/clubs/new"
            className="inline-flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium btn-accent"
          >
            + New business
          </Link>
        </div>
      </header>

      {/* Table */}
      <section className="rounded-2xl u-border u-surface backdrop-blur-md">
        <table className="w-full text-sm">
          <thead className="sticky-head">
            <tr>
              <th className="px-4 py-3 text-left">Business</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => (
              <tr key={c.id} className="border-t u-border">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.slug}</td>
                <td className="px-4 py-3">
                  <PlanBadge plan={c.subscriptionPlan} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.subscriptionStatus} />
                </td>
                <td className="px-4 py-3">
                  {format(new Date(c.createdAt), "dd/MM/yyyy, HH:mm")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/${c.slug}/admin`}
                      className="inline-flex items-center rounded-full u-border u-surface px-3 py-1.5 text-xs hover:u-surface-2 transition"
                    >
                      Open admin
                    </Link>
                    <form action={deleteClub}>
                      <input type="hidden" name="clubId" value={c.id} />
                      <ConfirmDeleteButton
                        label="Delete"
                        confirmText={`Delete business “${c.name}”? This is permanent.`}
                      />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {clubs.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center opacity-70" colSpan={6}>
                  No businesses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}