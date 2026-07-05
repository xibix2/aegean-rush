// src/app/[club]/layout.tsx
export const dynamic = "force-dynamic";

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // You could load club data here later if needed.
  return <>{children}</>;
}
