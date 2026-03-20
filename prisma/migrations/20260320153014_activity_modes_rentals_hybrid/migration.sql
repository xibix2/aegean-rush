-- CreateEnum
CREATE TYPE "ActivityMode" AS ENUM ('FIXED_SEAT_EVENT', 'DYNAMIC_RENTAL', 'HYBRID_UNIT_BOOKING');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "ageInfo" TEXT,
ADD COLUMN     "bringText" TEXT,
ADD COLUMN     "cancellationText" TEXT,
ADD COLUMN     "guestsPerUnit" INTEGER,
ADD COLUMN     "includedText" TEXT,
ADD COLUMN     "maxUnitsPerBooking" INTEGER,
ADD COLUMN     "meetingPoint" TEXT,
ADD COLUMN     "mode" "ActivityMode" NOT NULL DEFAULT 'FIXED_SEAT_EVENT',
ADD COLUMN     "pricingNotes" TEXT,
ADD COLUMN     "safetyInfo" TEXT,
ADD COLUMN     "skillLevel" TEXT,
ADD COLUMN     "slotIntervalMin" INTEGER;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingEndAt" TIMESTAMP(3),
ADD COLUMN     "bookingStartAt" TIMESTAMP(3),
ADD COLUMN     "durationMinSnapshot" INTEGER,
ADD COLUMN     "pricingLabelSnapshot" TEXT,
ADD COLUMN     "reservedUnits" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "unitPriceSnapshot" INTEGER;

-- CreateTable
CREATE TABLE "ActivityDurationOption" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "label" TEXT,
    "durationMin" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityDurationOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityDurationOption_activityId_sortOrder_idx" ON "ActivityDurationOption"("activityId", "sortOrder");

-- CreateIndex
CREATE INDEX "Booking_activityId_bookingStartAt_bookingEndAt_idx" ON "Booking"("activityId", "bookingStartAt", "bookingEndAt");

-- AddForeignKey
ALTER TABLE "ActivityDurationOption" ADD CONSTRAINT "ActivityDurationOption_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
