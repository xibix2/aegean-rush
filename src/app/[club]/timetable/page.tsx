import { Suspense } from "react";
import TimetableClient from "./TimetableClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function TimetablePage() {
  return (
    <Suspense fallback={<div className="opacity-60 p-6">Loading timetable…</div>}>
      <TimetableClient />
    </Suspense>
  );
}