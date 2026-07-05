-- CreateTable
CREATE TABLE "ActivityTicketType" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityTicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingTicket" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "ticketTypeId" TEXT,
    "labelSnapshot" TEXT NOT NULL,
    "priceCentsSnapshot" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "BookingTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityTicketType_activityId_sortOrder_idx" ON "ActivityTicketType"("activityId", "sortOrder");

-- CreateIndex
CREATE INDEX "BookingTicket_bookingId_idx" ON "BookingTicket"("bookingId");

-- CreateIndex
CREATE INDEX "BookingTicket_ticketTypeId_idx" ON "BookingTicket"("ticketTypeId");

-- AddForeignKey
ALTER TABLE "ActivityTicketType" ADD CONSTRAINT "ActivityTicketType_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTicket" ADD CONSTRAINT "BookingTicket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTicket" ADD CONSTRAINT "BookingTicket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ActivityTicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
