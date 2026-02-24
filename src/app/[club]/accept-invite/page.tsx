// src/app/[club]/accept-invite/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MaybePromise<T> = T | Promise<T>;

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: MaybePromise<{ club: string }>;
  searchParams?: MaybePromise<Record<string, string | string[] | undefined>>;
}) {
  // ✅ Support Next 14 (plain objects) + Next 15 (Promises)
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : {};

  const clubSlug = resolvedParams.club;

  const tokenRaw = resolvedSearchParams["token"];
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw || "";

  if (!token) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <div className="rounded-2xl u-border u-surface p-6 text-center">
          <h1 className="text-xl font-semibold">Accept invite</h1>
          <p className="mt-2 text-sm opacity-70">
            Missing invite token. Please use the link from your email.
          </p>
        </div>
      </main>
    );
  }

  // ✅ Verify invite exists + belongs to the club in the URL
  const invite = await prisma.staffInvite.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: new Date() },
      club: { slug: clubSlug },
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      club: { select: { name: true, slug: true } },
    },
  });

  if (!invite) {
    notFound();
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <div className="rounded-2xl u-border u-surface p-6 text-center">
        <h1 className="text-xl font-semibold">Accept invite</h1>
        <p className="mt-2 text-sm opacity-70">
          Invite found for <span className="font-medium">{invite.email}</span>{" "}
          to join <span className="font-medium">{invite.club.name}</span> as{" "}
          <span className="font-medium">{invite.role}</span>.
        </p>

        <p className="mt-4 text-xs opacity-60">
          Next step: create account / set password / mark invite used.
        </p>
      </div>
    </main>
  );
}