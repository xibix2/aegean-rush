// src/lib/booking-engine.ts
import { BookingStatus, ActivityMode } from "@prisma/client";

type ExistingBookingLike = {
  id: string;
  status: BookingStatus;
  createdAt: Date;
  partySize: number;
  reservedUnits: number;
  bookingStartAt: Date | null;
  bookingEndAt: Date | null;
};

type DurationOptionLike = {
  id: string;
  label: string | null;
  durationMin: number;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
};

type TicketTypeLike = {
  id: string;
  label: string;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
};

type ActivityLike = {
  id: string;
  name: string;
  mode: ActivityMode;
  minParty: number;
  maxParty: number;
  basePrice: number | null;
  guestsPerUnit: number | null;
  maxUnitsPerBooking: number | null;
  slotIntervalMin: number | null;
  durationOptions: DurationOptionLike[];
  ticketTypes?: TicketTypeLike[];
};

type TimeSlotLike = {
  id: string;
  activityId: string;
  startAt: Date;
  endAt: Date | null;
  capacity: number;
  priceCents: number;
};

export type BookingEngineInput = {
  activity: ActivityLike;
  slot: TimeSlotLike;
  existingBookings: ExistingBookingLike[];

  partySize?: number | null;

  startTime?: string | Date | null;
  durationOptionId?: string | null;

  ticketSelections?: Array<{
    ticketTypeId: string;
    quantity: number;
  }> | null;

  units?: number | null;
  guests?: number | null;

  now?: Date;
};

export type BookingEngineResult = {
  isValid: boolean;
  errors: string[];

  mode: ActivityMode;

  slotId: string;
  activityId: string;

  partySize: number;

  reservedUnits: number;
  requiredUnits: number | null;

  bookingStartAt: Date;
  bookingEndAt: Date;

  durationMin: number | null;

  ticketBreakdown?: Array<{
    ticketTypeId: string;
    labelSnapshot: string;
    priceCentsSnapshot: number;
    quantity: number;
  }> | null;

  unitPrice: number;
  totalPrice: number;

  pricingLabel: string | null;

  remainingCapacity?: number | null;
  remainingUnitsForRange?: number | null;
};

const PENDING_HOLD_MINUTES = 30;
const RENTAL_BOOKING_STEP_MINUTES = 5;

const MIN_BOOKING_NOTICE_MINUTES = 120;

function isFreshPending(createdAt: Date, now: Date) {
  return (now.getTime() - createdAt.getTime()) / 60000 < PENDING_HOLD_MINUTES;
}

function countsAgainstAvailability(
  status: BookingStatus,
  createdAt: Date,
  now: Date
) {
  return (
    status === "paid" ||
    (status === "pending" && isFreshPending(createdAt, now))
  );
}

function getActiveBookings(
  existingBookings: ExistingBookingLike[],
  now: Date
) {
  return existingBookings.filter((b) =>
    countsAgainstAvailability(b.status, b.createdAt, now)
  );
}

function parseStartTime(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  const s = String(input).trim();

  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (m) {
    const [, y, mo, d, h, mi] = m.map(Number);
    const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ceilDiv(a: number, b: number) {
  return Math.ceil(a / b);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function normalizePositiveInt(n: number | null | undefined, fallback: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function resolveDurationOption(
  activity: ActivityLike,
  durationOptionId: string | null | undefined
) {
  if (!durationOptionId) return null;
  return (
    activity.durationOptions.find((d) => d.id === durationOptionId && d.isActive) ??
    null
  );
}

function getFixedEventPrice(slot: TimeSlotLike, activity: ActivityLike) {
  const raw = slot.priceCents ?? activity.basePrice ?? 0;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function getRentalUnitPrice(
  slot: TimeSlotLike,
  activity: ActivityLike,
  duration: DurationOptionLike
) {
  const raw = duration.priceCents ?? slot.priceCents ?? activity.basePrice ?? 0;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function coercePartySize(input: number | null | undefined) {
  if (typeof input !== "number" || !Number.isFinite(input)) return 1;
  return Math.max(1, Math.floor(input));
}

function validatePartyBounds(activity: ActivityLike, partySize: number, errors: string[]) {
  if (activity.minParty && partySize < activity.minParty) {
    errors.push(`Minimum party size is ${activity.minParty}.`);
  }
  if (activity.maxParty && partySize > activity.maxParty) {
    errors.push(`Maximum party size is ${activity.maxParty}.`);
  }
}

function validateInsideWindow(
  start: Date,
  end: Date,
  slot: TimeSlotLike,
  errors: string[]
) {
  if (start < slot.startAt) {
    errors.push("Selected start time is before the availability window.");
  }

  if (!slot.endAt) {
    errors.push("Availability window is missing an end time.");
    return;
  }

  if (end > slot.endAt) {
    errors.push("Selected booking exceeds the availability window.");
  }

  if (end <= start) {
    errors.push("Booking end time must be after start time.");
  }
}

function getAllowedStartStepMinutes(activity: ActivityLike) {
  const configured = activity.slotIntervalMin ?? null;

  // Fixed events keep their configured interval
  if (activity.mode === ActivityMode.FIXED_SEAT_EVENT) {
    if (!configured || configured <= 1) return null;
    return configured;
  }

  // Rentals / hybrid bookings → always use 15-minute steps
  return Math.max(15, configured ?? 15);
}

function validateInterval(
  activity: ActivityLike,
  start: Date,
  slot: TimeSlotLike,
  errors: string[]
) {
  const step = getAllowedStartStepMinutes(activity);
  if (!step || step <= 1) return;

  const diffMs = start.getTime() - slot.startAt.getTime();
  if (diffMs < 0) return;

  const diffMin = diffMs / 60000;
  if (diffMin % step !== 0) {
    errors.push(`Start time must align to ${step}-minute intervals.`);
  }
}

function validateBookingNotice(
  start: Date,
  now: Date,
  errors: string[]
) {
  const minAllowedTime = new Date(
    now.getTime() + MIN_BOOKING_NOTICE_MINUTES * 60 * 1000
  );

  if (start < minAllowedTime) {
    errors.push(
      `Bookings must be made at least ${MIN_BOOKING_NOTICE_MINUTES / 60} hours before start time.`
    );
  }
}

function usedSeatsForFixedEvent(activeBookings: ExistingBookingLike[]) {
  return activeBookings.reduce((sum, b) => sum + (b.partySize ?? 0), 0);
}

function usedUnitsForRange(
  activeBookings: ExistingBookingLike[],
  rangeStart: Date,
  rangeEnd: Date,
  slot: TimeSlotLike
) {
  let used = 0;

  for (const b of activeBookings) {
    const bStart = b.bookingStartAt ?? slot.startAt;
    const bEnd =
      b.bookingEndAt ??
      slot.endAt ??
      new Date(bStart.getTime() + 90 * 60 * 1000);

    if (overlaps(bStart, bEnd, rangeStart, rangeEnd)) {
      used += Math.max(1, b.reservedUnits ?? 1);
    }
  }

  return used;
}

function resolveTicketBreakdown(
  activity: ActivityLike,
  selections: BookingEngineInput["ticketSelections"]
) {
  const activeTicketTypes = (activity.ticketTypes ?? []).filter((t) => t.isActive);

  if (activeTicketTypes.length === 0) {
    return {
      hasTicketTypes: false,
      partySize: null,
      totalPrice: null,
      breakdown: null,
      errors: [] as string[],
    };
  }

  const errors: string[] = [];
  const selected = selections ?? [];

  const breakdown = activeTicketTypes
    .map((ticket) => {
      const found = selected.find((s) => s.ticketTypeId === ticket.id);
      const quantity =
        typeof found?.quantity === "number" && Number.isFinite(found.quantity)
          ? Math.max(0, Math.floor(found.quantity))
          : 0;

      return {
        ticketTypeId: ticket.id,
        labelSnapshot: ticket.label,
        priceCentsSnapshot: ticket.priceCents,
        quantity,
      };
    })
    .filter((item) => item.quantity > 0);

  const partySize = breakdown.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = breakdown.reduce(
    (sum, item) => sum + item.quantity * item.priceCentsSnapshot,
    0
  );

  if (partySize <= 0) {
    errors.push("Please select at least one ticket.");
  }

  return {
    hasTicketTypes: true,
    partySize,
    totalPrice,
    breakdown,
    errors,
  };
}

export function getBookingQuoteAndAvailability(
  input: BookingEngineInput
): BookingEngineResult {
  const now = input.now ?? new Date();
  const { activity, slot, existingBookings } = input;
  const activeBookings = getActiveBookings(existingBookings, now);
  const errors: string[] = [];

  const mode = activity.mode;
  const ticketResolution =
    mode === ActivityMode.FIXED_SEAT_EVENT
      ? resolveTicketBreakdown(activity, input.ticketSelections)
      : null;

  const partySize =
    ticketResolution?.hasTicketTypes
      ? ticketResolution.partySize ?? 1
      : coercePartySize(input.partySize);

  if (ticketResolution?.errors.length) {
    errors.push(...ticketResolution.errors);
  }

  validatePartyBounds(activity, partySize, errors);

  if (slot.activityId !== activity.id) {
    errors.push("Time slot does not belong to the selected activity.");
  }

  if (slot.capacity <= 0) {
    errors.push("This slot has no available capacity.");
  }

  if (mode === ActivityMode.FIXED_SEAT_EVENT) {
    const used = usedSeatsForFixedEvent(activeBookings);
    const remaining = Math.max(0, slot.capacity - used);
    const unitPrice = getFixedEventPrice(slot, activity);
    const totalPrice =
      ticketResolution?.hasTicketTypes && ticketResolution.totalPrice != null
        ? ticketResolution.totalPrice
        : unitPrice * partySize;

    if (remaining < partySize) {
      errors.push("Not enough seats left.");
    }

    const bookingStartAt = slot.startAt;
    const bookingEndAt =
      slot.endAt ?? new Date(slot.startAt.getTime() + 90 * 60 * 1000);
    
    validateBookingNotice(bookingStartAt, now, errors);

    return {
      isValid: errors.length === 0,
      errors,
      mode,
      slotId: slot.id,
      activityId: activity.id,
      partySize,
      reservedUnits: 1,
      requiredUnits: null,
      bookingStartAt,
      bookingEndAt,
      durationMin: null,
      unitPrice,
      totalPrice,
      pricingLabel: null,
      ticketBreakdown: ticketResolution?.breakdown ?? null,
      remainingCapacity: remaining,
      remainingUnitsForRange: null,
    };
  }

  const duration = resolveDurationOption(activity, input.durationOptionId);
  if (!duration) {
    errors.push("A valid duration option is required.");
  }

  const start = parseStartTime(input.startTime);
  if (!start) {
    errors.push("A valid booking start time is required.");
  }

  const durationMin = duration?.durationMin ?? null;
  const bookingEndAt =
    start && durationMin
      ? new Date(start.getTime() + durationMin * 60 * 1000)
      : null;

  if (start && bookingEndAt) {
    validateInsideWindow(start, bookingEndAt, slot, errors);
    validateInterval(activity, start, slot, errors);
    validateBookingNotice(start, now, errors);
  }

  const requestedUnits = normalizePositiveInt(input.units, 1);

  if (
    activity.maxUnitsPerBooking &&
    requestedUnits > activity.maxUnitsPerBooking
  ) {
    errors.push(`Maximum units per booking is ${activity.maxUnitsPerBooking}.`);
  }

  if (mode === ActivityMode.DYNAMIC_RENTAL) {
    const unitPrice = duration ? getRentalUnitPrice(slot, activity, duration) : 0;
    const totalPrice = unitPrice * requestedUnits;

    let remainingUnitsForRange: number | null = null;

    if (start && bookingEndAt) {
      const used = usedUnitsForRange(activeBookings, start, bookingEndAt, slot);
      remainingUnitsForRange = Math.max(0, slot.capacity - used);

      if (remainingUnitsForRange < requestedUnits) {
        errors.push("Not enough units available for the selected time range.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      mode,
      slotId: slot.id,
      activityId: activity.id,
      partySize,
      reservedUnits: requestedUnits,
      requiredUnits: requestedUnits,
      bookingStartAt: start ?? slot.startAt,
      bookingEndAt:
        bookingEndAt ??
        slot.endAt ??
        new Date(slot.startAt.getTime() + 90 * 60 * 1000),
      durationMin,
      unitPrice,
      totalPrice,
      pricingLabel: duration?.label ?? null,
      remainingCapacity: null,
      remainingUnitsForRange,
    };
  }

  const guests = normalizePositiveInt(input.guests ?? input.partySize, partySize);
  const guestsPerUnit = normalizePositiveInt(activity.guestsPerUnit, 1);
  const requiredUnits = ceilDiv(guests, guestsPerUnit);

  if (requestedUnits < requiredUnits) {
    errors.push(`At least ${requiredUnits} unit(s) are required for ${guests} guest(s).`);
  }

  if (
    activity.maxUnitsPerBooking &&
    requestedUnits > activity.maxUnitsPerBooking
  ) {
    errors.push(`Maximum units per booking is ${activity.maxUnitsPerBooking}.`);
  }

  const unitPrice = duration ? getRentalUnitPrice(slot, activity, duration) : 0;
  const totalPrice = unitPrice * requestedUnits;

  let remainingUnitsForRange: number | null = null;

  if (start && bookingEndAt) {
    const used = usedUnitsForRange(activeBookings, start, bookingEndAt, slot);
    remainingUnitsForRange = Math.max(0, slot.capacity - used);

    if (remainingUnitsForRange < requestedUnits) {
      errors.push("Not enough units available for the selected time range.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    mode,
    slotId: slot.id,
    activityId: activity.id,
    partySize: guests,
    reservedUnits: requestedUnits,
    requiredUnits,
    bookingStartAt: start ?? slot.startAt,
    bookingEndAt:
      bookingEndAt ??
      slot.endAt ??
      new Date(slot.startAt.getTime() + 90 * 60 * 1000),
    durationMin,
    unitPrice,
    totalPrice,
    pricingLabel: duration?.label ?? null,
    remainingCapacity: null,
    remainingUnitsForRange,
  };
}