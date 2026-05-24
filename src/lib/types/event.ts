export const EVENT_TYPES = [
  "Day Party",
  "Night Party",
  "After Hours",
  "Brunch / Daytime",
  "Live Music / DJ",
  "Private Event",
  "Other",
] as const;

export const DEFAULT_EVENT_TYPE = "Night Party" as const;

export type EventRecurrenceInput = {
  enabled: boolean;
  by_weekday: number[];
  until_date: string;
  interval_weeks?: number;
};

export type BusinessEventFormData = {
  id?: string;
  title: string;
  description: string;
  event_type: string;
  neighborhood: string;
  starts_at: string;
  ends_at: string;
  image_url: string;
  /** Extra ISO dates (YYYY-MM-DD) — same local start/end time as the primary event. */
  additional_dates: string[];
  recurrence?: EventRecurrenceInput | null;
  ticket_tiers?: import("@/lib/types/ticket").TicketTierInput[];
};

export type BusinessEventRow = {
  id: string;
  venue_id: string | null;
  title: string;
  description: string | null;
  event_type: string;
  neighborhood: string | null;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};
