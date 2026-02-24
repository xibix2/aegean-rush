// src/app/[club]/layout.tsx
export const dynamic = "force-dynamic";

export default function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { club: string };
}) {
  // You could load club data here later if needed.
  return <>{children}</>;
}