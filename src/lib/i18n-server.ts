// src/lib/i18n-server.ts
import { cookies } from "next/headers";

/** Supported languages */
export type Lang = "en" | "el";

/** Shape of our translations */
type NavDict = {
  courts: string;
  contact: string;
  dashboard: string;
  activities: string;
  timeSlots: string;
  bookings: string;
  stats: string;
  exportCsv: string;
  settings: string;
};

/** Table, filters and summary are used by the Bookings page */
type BookingsTableDict = {
  created: string;
  status: string;
  activity: string;   // "Activity / Court"
  time: string;
  name: string;
  email: string;
  players: string;    // "Pl."
  amount?: string;    // optional label for amount column
};

type BookingsFiltersDict = {
  all: string;
  pending: string;
  confirmed: string;
  cancelled: string;
  refunded: string;
};

type BookingsSummaryDict = {
  bookings: string;
  confirmed: string;
  cancelled: string;
  revenue: string; // include trailing colon in UI if you want
};

type BookingsDict = {
  title: string;
  date: string;
  searchPlaceholder: string;
  sortNewest: string;
  sortOldest: string;
  refresh: string;
  empty: string;

  /** Nested namespaces used in code */
  filters: BookingsFiltersDict;
  table: BookingsTableDict;
  summary: BookingsSummaryDict;

  /** ---- Back-compat ALIASES for older code (safe to keep) ---- */
  // filter pills (aliases)
  all?: string;
  pending?: string;
  confirmed?: string;
  cancelled?: string;
  refunded?: string;

  // table headers (aliases)
  created?: string;
  status?: string;
  activityCourt?: string;
  playersShort?: string;
  amountShort?: string;

  // summary bar (aliases)
  bookingsLabel?: string;
  confirmedLabel?: string;
  cancelledLabel?: string;
  revenueLabel?: string;
};

type CommonDict = {
  save: string;
  back: string;
};

export type I18nDict = {
  nav: NavDict;
  bookings: BookingsDict;
  common: CommonDict;
};

/** English strings */
const en: I18nDict = {
  nav: {
    courts: "Courts",
    contact: "Contact",
    dashboard: "Dashboard",
    activities: "Activities",
    timeSlots: "Time Slots",
    bookings: "Bookings",
    stats: "Stats",
    exportCsv: "Export CSV",
    settings: "Settings",
  },
  bookings: {
    title: "Admin — Bookings",
    date: "Date",
    searchPlaceholder: "Search name / email / activity…",
    sortNewest: "Sort: Newest",
    sortOldest: "Sort: Oldest",
    refresh: "Refresh",
    empty: "No bookings found.",

    filters: {
      all: "All",
      pending: "Pending",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      refunded: "Refunded",
    },

    table: {
      created: "Created",
      status: "Status",
      activity: "Activity / Court",
      time: "Time",
      name: "Name",
      email: "Email",
      players: "Pl.",
      amount: "",
    },

    summary: {
      bookings: "Bookings",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      revenue: "Revenue:",
    },

    // ---- aliases for back-compat (optional to keep) ----
    all: "All",
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    created: "Created",
    status: "Status",
    activityCourt: "Activity / Court",
    playersShort: "Pl.",
    amountShort: "Amount",
    bookingsLabel: "Bookings",
    confirmedLabel: "Confirmed",
    cancelledLabel: "Cancelled",
    revenueLabel: "Revenue",
  },
  common: {
    save: "Save",
    back: "Back",
  },
};

/** Greek strings */
const el: I18nDict = {
  nav: {
    courts: "Γήπεδα",
    contact: "Επικοινωνία",
    dashboard: "Πίνακας",
    activities: "Δραστηριότητες",
    timeSlots: "Ώρες",
    bookings: "Κρατήσεις",
    stats: "Στατιστικά",
    exportCsv: "Εξαγωγή CSV",
    settings: "Ρυθμίσεις",
  },
  bookings: {
    title: "Διαχείριση — Κρατήσεις",
    date: "Ημερομηνία",
    searchPlaceholder: "Αναζήτηση ονόματος / email / δραστηριότητας…",
    sortNewest: "Ταξ.: Νεότερα",
    sortOldest: "Ταξ.: Παλαιότερα",
    refresh: "Ανανέωση",
    empty: "Δεν βρέθηκαν κρατήσεις.",

    filters: {
      all: "Όλες",
      pending: "Σε εκκρεμότητα",
      confirmed: "Επιβεβαιωμένες",
      cancelled: "Ακυρωμένες",
      refunded: "Επιστροφές",
    },

    table: {
      created: "Δημιουργία",
      status: "Κατάσταση",
      activity: "Δραστηριότητα / Γήπεδο",
      time: "Ώρα",
      name: "Όνομα",
      email: "Email",
      players: "Παίκ.",
      amount: "",
    },

    summary: {
      bookings: "Κρατήσεις",
      confirmed: "Επιβεβαιωμένες",
      cancelled: "Ακυρωμένες",
      revenue: "Έσοδα:",
    },

    // ---- aliases for back-compat (optional to keep) ----
    all: "Όλες",
    pending: "Σε εκκρεμότητα",
    confirmed: "Επιβεβαιωμένες",
    cancelled: "Ακυρωμένες",
    refunded: "Επιστροφές",
    created: "Δημιουργήθηκε",
    status: "Κατάσταση",
    activityCourt: "Δραστηριότητα / Γήπεδο",
    playersShort: "Παίκ.",
    amountShort: "Ποσό",
    bookingsLabel: "Κρατήσεις",
    confirmedLabel: "Επιβεβαιωμένες",
    cancelledLabel: "Ακυρωμένες",
    revenueLabel: "Έσοδα",
  },
  common: {
    save: "Αποθήκευση",
    back: "Πίσω",
  },
};

/** Registry */
const DICTS: Record<Lang, I18nDict> = { en, el };

/** Read language from cookie (Next 15: cookies() is async) */
export async function getServerLang(): Promise<Lang> {
  const jar = await cookies();
  const v = jar.get("ui_lang")?.value as Lang | undefined;
  return v === "el" ? "el" : "en";
}

/** Get the dictionary for the current request (server-side). */
export async function getServerDict(): Promise<I18nDict> {
  const lang = await getServerLang();
  return DICTS[lang];
}

/** Utility to resolve a key path like "bookings.title" on server */
export async function tServer(ns: keyof I18nDict, key: string): Promise<string> {
  const dict = await getServerDict();
  const bucket = dict[ns] as Record<string, any>;
  return bucket?.[key] ?? key;
}

/** Export directly if you already know the lang (used by client provider) */
export function getDictFor(lang: Lang): I18nDict {
  return DICTS[lang] ?? en;
}