-- CreateEnum
CREATE TYPE "HomepageSectionType" AS ENUM ('HERO', 'GALLERY', 'ACTIVITIES', 'HOW_IT_WORKS', 'WHY_CHOOSE_US', 'LOCATION', 'FAQ', 'FINAL_CTA');

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "type" "HomepageSectionType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "subtitle" TEXT,
    "body" TEXT,
    "primaryCtaLabel" TEXT,
    "primaryCtaHref" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
    "badgeText" TEXT,
    "dataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageGalleryImage" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageFaqItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageFaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageFeatureItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageFeatureItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomepageSection_clubId_sortOrder_idx" ON "HomepageSection"("clubId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_clubId_type_key" ON "HomepageSection"("clubId", "type");

-- CreateIndex
CREATE INDEX "HomepageGalleryImage_sectionId_sortOrder_idx" ON "HomepageGalleryImage"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "HomepageFaqItem_sectionId_sortOrder_idx" ON "HomepageFaqItem"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "HomepageFeatureItem_sectionId_sortOrder_idx" ON "HomepageFeatureItem"("sectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "HomepageSection" ADD CONSTRAINT "HomepageSection_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageGalleryImage" ADD CONSTRAINT "HomepageGalleryImage_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomepageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageFaqItem" ADD CONSTRAINT "HomepageFaqItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomepageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageFeatureItem" ADD CONSTRAINT "HomepageFeatureItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomepageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
