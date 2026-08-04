-- Availability blocks reserve capacity without creating a customer booking or payment.
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "units" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AvailabilityBlock_timeSlotId_startAt_endAt_idx"
ON "AvailabilityBlock"("timeSlotId", "startAt", "endAt");

CREATE INDEX "AvailabilityBlock_activityId_startAt_endAt_idx"
ON "AvailabilityBlock"("activityId", "startAt", "endAt");

ALTER TABLE "AvailabilityBlock"
ADD CONSTRAINT "AvailabilityBlock_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "Activity"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AvailabilityBlock"
ADD CONSTRAINT "AvailabilityBlock_timeSlotId_fkey"
FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
