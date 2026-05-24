export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type VenueDayHours = {
  closed: boolean;
  open: string | null;
  close: string | null;
};

export type VenueOpeningHours = Record<Weekday, VenueDayHours>;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function defaultOpeningHours(): VenueOpeningHours {
  const closed: VenueDayHours = { closed: true, open: null, close: null };
  const weekend: VenueDayHours = { closed: false, open: "21:00", close: "02:00" };
  return {
    monday: { ...closed },
    tuesday: { ...closed },
    wednesday: { ...closed },
    thursday: { ...weekend },
    friday: { ...weekend },
    saturday: { ...weekend },
    sunday: { closed: false, open: "20:00", close: "00:00" },
  };
}

function parseDayHours(value: unknown): VenueDayHours {
  if (!value || typeof value !== "object") {
    return { closed: true, open: null, close: null };
  }
  const row = value as Record<string, unknown>;
  return {
    closed: row.closed === true,
    open: typeof row.open === "string" ? row.open : null,
    close: typeof row.close === "string" ? row.close : null,
  };
}

export function parseOpeningHours(value: unknown): VenueOpeningHours {
  const base = defaultOpeningHours();
  if (!value || typeof value !== "object") return base;
  const row = value as Record<string, unknown>;
  for (const day of WEEKDAYS) {
    base[day] = parseDayHours(row[day]);
  }
  return base;
}

function formatTime12h(time: string): string {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw ?? 0);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return m > 0 ? `${hour12}:${String(m).padStart(2, "0")} ${period}` : `${hour12} ${period}`;
}

export function formatHoursLabel(hours: VenueOpeningHours): string {
  const segments: string[] = [];
  for (const day of WEEKDAYS) {
    const slot = hours[day];
    if (slot.closed) continue;
    if (!slot.open || !slot.close) continue;
    segments.push(
      `${WEEKDAY_LABELS[day].slice(0, 3)} ${formatTime12h(slot.open)}–${formatTime12h(slot.close)}`,
    );
  }
  if (segments.length === 0) return "Closed";
  return segments.join(" · ");
}

export function normalizeOpeningHours(hours: VenueOpeningHours): VenueOpeningHours {
  const next = { ...hours };
  for (const day of WEEKDAYS) {
    const slot = next[day];
    if (slot.closed) {
      next[day] = { closed: true, open: null, close: null };
      continue;
    }
    next[day] = {
      closed: false,
      open: slot.open?.trim() || null,
      close: slot.close?.trim() || null,
    };
  }
  return next;
}
