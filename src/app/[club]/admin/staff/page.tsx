// src/app/[club]/admin/staff/page.tsx
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { resend, FROM } from "@/lib/email";
import StaffInviteEmail from "@/emails/StaffInviteEmail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: "Super admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  COACH: "Instructor",
  STAFF: "Staff",
};

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

// ---------- server action: create invite ----------
async function inviteStaffAction(tenantSlug: string, formData: FormData) {
  "use server";

  const tenant = await requireTenant(tenantSlug);
  await requireClubAdminStrict(tenant.id);

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleValue = String(formData.get("role") || "STAFF") as UserRole;

  if (!email) return;

  const role: UserRole =
    roleValue === "MANAGER" ||
    roleValue === "COACH" ||
    roleValue === "STAFF" ||
    roleValue === "ADMIN"
      ? roleValue
      : "STAFF";

  const token = `invite_${Math.random().toString(36).slice(2)}${Date.now().toString(
    36
  )}`;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.staffInvite.deleteMany({
    where: {
      clubId: tenant.id,
      email,
      usedAt: null,
    },
  });

  const invite = await prisma.staffInvite.create({
    data: {
      clubId: tenant.id,
      email,
      role,
      token,
      expiresAt,
    },
  });

  const baseUrl = getBaseUrl();
  const acceptUrl = `${baseUrl}/${tenant.slug}/accept-invite?token=${encodeURIComponent(
    invite.token
  )}`;

  try {
    const roleLabel = ROLE_LABEL[role] ?? role;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `You’ve been invited to join ${tenant.name} (${roleLabel})`,
      react: StaffInviteEmail({
        clubName: tenant.name,
        roleLabel,
        inviteLink: acceptUrl,
        expiresAtISO: invite.expiresAt.toISOString(),
        token: invite.token,
      }),
    });
  } catch (e: any) {
    console.error("Failed to send team invite email:", e?.message || e);
  }

  revalidatePath(`/${tenantSlug}/admin/staff`);
}

// ---------- server action: remove staff member ----------
async function removeStaffAction(tenantSlug: string, formData: FormData) {
  "use server";

  const tenant = await requireTenant(tenantSlug);
  const session = await requireClubAdminStrict(tenant.id);

  const userId = String(formData.get("userId") || "").trim();
  if (!userId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, clubId: true },
  });

  if (!user) return;
  if (user.clubId !== tenant.id) return;

  if (user.role === "SUPERADMIN") {
    throw new Error("You cannot remove a super admin from this page.");
  }

  if (user.email === session.email) {
    throw new Error("You cannot remove your own admin account here.");
  }

  await prisma.user.delete({
    where: { id: user.id },
  });

  revalidatePath(`/${tenantSlug}/admin/staff`);
}

// ---------- page ----------
export default async function StaffPage() {
  const tenant = await requireTenant();
  const session = await requireClubAdminStrict(tenant.id);

  const [users, invites] = await Promise.all([
    prisma.user.findMany({
      where: { clubId: tenant.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.staffInvite.findMany({
      where: {
        clubId: tenant.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        token: true,
      },
    }),
  ]);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-accent-gradient">Team & access</span>
          </h1>
          <p className="mt-1 text-sm opacity-70">
            Manage who can log into the{" "}
            <span className="font-medium">{tenant.name}</span> dashboard.
          </p>
        </div>

        <Link
          href={`/${tenant.slug}/admin`}
          className="inline-flex items-center rounded-full u-border u-surface px-3 py-1.5 text-sm hover:u-surface-2 transition"
        >
          ← Back to dashboard
        </Link>
      </header>

      <section className="rounded-2xl u-border u-surface px-4 py-3 text-sm flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <p className="opacity-80">
          Admins can invite and remove team members. Roles control what each
          person can see and manage in the business dashboard.
        </p>
        <span className="text-[11px] uppercase tracking-wide font-semibold opacity-60">
          Team roles
        </span>
      </section>

      <section className="rounded-2xl u-border u-surface p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
            Invite team member
          </h2>
          <span className="text-[11px] opacity-60">
            They’ll receive an email with their invite link.
          </span>
        </div>

        <form
          action={inviteStaffAction.bind(null, tenant.slug)}
          className="flex flex-col sm:flex-row gap-3 pt-1"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="team@yourbusiness.com"
            className="flex-1 h-10 rounded-lg u-border u-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
          />
          <select
            name="role"
            className="h-10 rounded-lg u-border u-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            defaultValue="STAFF"
          >
            <option value="MANAGER">Manager</option>
            <option value="COACH">Instructor</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            type="submit"
            className="h-10 px-4 rounded-xl text-sm font-medium btn-accent whitespace-nowrap"
          >
            Send invite
          </button>
        </form>

        {invites.length > 0 && (
          <p className="text-xs opacity-60">
            Each invite includes a unique access link and token.
          </p>
        )}
      </section>

      <section className="rounded-2xl u-border u-surface overflow-hidden">
        {users.length === 0 ? (
          <div className="p-6 text-sm opacity-75">
            No team members yet. Your own admin account is created automatically
            when you create a business.
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[color-mix(in_oklab,var(--color-surface),black_4%)] text-left text-xs uppercase tracking-wide opacity-70">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 hidden sm:table-cell">Added</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u.email === session.email;

                return (
                  <tr
                    key={u.id}
                    className={
                      i % 2 === 0
                        ? "border-t border-[rgba(255,255,255,0.04)]"
                        : "border-t border-[rgba(255,255,255,0.04)] bg-[color-mix(in_oklab,var(--color-surface),black_3%)]"
                    }
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">{u.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                                   bg-[color-mix(in_oklab,var(--accent-500),transparent_88%)]
                                   text-[color-mix(in_oklab,var(--accent-200),white_15%)]"
                      >
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell opacity-70">
                      {u.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs flex items-center justify-end gap-3">
                      <span className="opacity-60">Active</span>
                      {!isSelf && u.role !== "SUPERADMIN" && (
                        <form
                          action={removeStaffAction.bind(null, tenant.slug)}
                          className="inline"
                        >
                          <input type="hidden" name="userId" value={u.id} />
                          <button
                            type="submit"
                            className="px-2 py-1 rounded-full border border-red-500/40 text-[11px] text-red-300 hover:bg-red-500/10 transition"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {invites.length > 0 && (
        <section className="rounded-2xl u-border u-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
            Pending invites
          </h2>
          <div className="space-y-2 text-sm">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl px-3 py-2
                           bg-[color-mix(in_oklab,var(--color-surface),black_3%)]"
              >
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-xs opacity-65">
                    Role: {ROLE_LABEL[inv.role] ?? inv.role} · Invited on{" "}
                    {inv.createdAt.toLocaleDateString()} · Expires{" "}
                    {inv.expiresAt.toLocaleDateString()}
                  </div>
                  <div className="text-[11px] opacity-55 mt-0.5">
                    Token (for testing): <code>{inv.token}</code>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-300">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}