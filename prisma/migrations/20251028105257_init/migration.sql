/*
  Warnings:

  - You are about to drop the column `priceOverride` on the `TimeSlot` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TimeSlot` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[activityId,startAt]` on the table `TimeSlot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `priceCents` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sport" TEXT NOT NULL DEFAULT 'tennis',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "minParty" DROP DEFAULT,
ALTER COLUMN "basePrice" DROP NOT NULL,
ALTER COLUMN "requiresInstructor" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TimeSlot" DROP COLUMN "priceOverride",
DROP COLUMN "status",
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "priceCents" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "tz" TEXT NOT NULL,
    "lang" TEXT,
    "currency" TEXT,
    "theme" TEXT,
    "accent" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_activityId_startAt_key" ON "TimeSlot"("activityId", "startAt");
