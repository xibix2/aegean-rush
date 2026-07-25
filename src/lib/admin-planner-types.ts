export type PlannerMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

export type PlannerDurationOption = {
  id: string;
  label: string | null;
  durationMin: number;
  priceCents: number;
};

export type PlannerBooking = {
  id: string;
  slotId: string;
  status: "paid" | "pending";
  customerName: string;
  customerPhone: string | null;
  partySize: number;
  reservedUnits: number;
  totalPrice: number;
  startAt: string;
  endAt: string;
  pricingLabel: string | null;
  source: "online" | "walkIn";
};

export type PlannerSlot = {
  id: string;
  status: "open" | "closed";
  startAt: string;
  endAt: string;
  capacity: number;
  priceCents: number;
  bookings: PlannerBooking[];
};

export type PlannerActivity = {
  id: string;
  name: string;
  mode: PlannerMode;
  minParty: number;
  maxParty: number;
  guestsPerUnit: number | null;
  maxUnitsPerBooking: number | null;
  slotIntervalMin: number | null;
  durationOptions: PlannerDurationOption[];
  slots: PlannerSlot[];
};
