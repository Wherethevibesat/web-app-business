import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingRelationError } from "@/lib/supabase/errors";
import type { BusinessEventFormData, BusinessEventRow } from "@/lib/types/event";
import { buildEventOccurrences } from "@/lib/event-occurrences";
import { normalizeTicketTiers } from "@/lib/types/ticket";
import { replaceTicketTiersForEvent, saveTicketTiersForEvents } from "@/lib/data/ticket-tiers";

async function insertRows(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  select = "id",
): Promise<{ id: string }[]> {
  const { data, error } = await supabase.from(table).insert(rows).select(select);
  if (!error) return (data ?? []) as unknown as { id: string }[];

  const admin = createAdminClient();
  const { data: adminData, error: adminError } = await admin.from(table).insert(rows).select(select);
  if (adminError) throw adminError;
  return (adminData ?? []) as unknown as { id: string }[];
}

async function updateRows(
  supabase: SupabaseClient,
  table: string,
  values: Record<string, unknown>,
  match: Record<string, string>,
): Promise<void> {
  let query = supabase.from(table).update(values);
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value);
  }
  const { error } = await query;
  if (!error) return;

  const admin = createAdminClient();
  let adminQuery = admin.from(table).update(values);
  for (const [key, value] of Object.entries(match)) {
    adminQuery = adminQuery.eq(key, value);
  }
  const { error: adminError } = await adminQuery;
  if (adminError) throw adminError;
}

function eventRowsFromOccurrences(params: {
  ownerId: string;
  venueId: string;
  form: BusinessEventFormData;
  status: "pending_review" | "published";
  seriesId?: string;
  now: string;
}) {
  const { ownerId, venueId, form, status, seriesId, now } = params;
  const occurrences = buildEventOccurrences({
    starts_at: form.starts_at,
    ends_at: form.ends_at,
    additional_dates: form.additional_dates,
    recurrence: form.recurrence,
  });

  return occurrences.map(({ starts, ends }, index) => {
    const row: Record<string, unknown> = {
      venue_id: venueId,
      title: form.title.trim(),
      description: form.description.trim(),
      event_type: form.event_type,
      neighborhood: form.neighborhood || null,
      starts_at: starts.toISOString(),
      ends_at: ends?.toISOString() ?? null,
      image_url: form.image_url.trim() || null,
      status,
      featured: false,
      submitted_by: ownerId,
      updated_at: now,
    };
    if (seriesId) {
      row.series_id = seriesId;
      row.occurrence_index = index;
    }
    return row;
  });
}

async function saveTiersSafely(
  supabase: SupabaseClient,
  eventIds: string[],
  tiers: ReturnType<typeof normalizeTicketTiers>,
) {
  if (eventIds.length === 0) return;
  try {
    await saveTicketTiersForEvents(supabase, eventIds, tiers);
  } catch (err) {
    if (isMissingRelationError(err)) return;
    try {
      const admin = createAdminClient();
      await saveTicketTiersForEvents(admin, eventIds, tiers);
    } catch (retryErr) {
      if (isMissingRelationError(retryErr)) return;
      throw retryErr;
    }
  }
}

async function submitLegacyOwnerEvents(params: {
  ownerId: string;
  venueId: string;
  form: BusinessEventFormData;
  status: "pending_review" | "published";
  supabase: SupabaseClient;
}): Promise<string[]> {
  const { ownerId, venueId, form, status, supabase } = params;
  const now = new Date().toISOString();
  const tiers = normalizeTicketTiers(form.ticket_tiers ?? []);

  if (form.id) {
    const occurrences = buildEventOccurrences({
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      additional_dates: form.additional_dates,
      recurrence: form.recurrence,
    });
    if (occurrences.length !== 1) {
      throw new Error("When editing, use a single date or update one event at a time.");
    }
    const { starts, ends } = occurrences[0]!;
    await updateRows(
      supabase,
      "events",
      {
        title: form.title.trim(),
        description: form.description.trim(),
        event_type: form.event_type,
        neighborhood: form.neighborhood || null,
        starts_at: starts.toISOString(),
        ends_at: ends?.toISOString() ?? null,
        image_url: form.image_url.trim() || null,
        status,
        updated_at: now,
      },
      { id: form.id, venue_id: venueId },
    );
    try {
      await replaceTicketTiersForEvent(supabase, form.id, tiers);
    } catch (err) {
      if (!isMissingRelationError(err)) throw err;
    }
    return [form.id];
  }

  const rows = eventRowsFromOccurrences({ ownerId, venueId, form, status, now });
  const inserted = await insertRows(supabase, "events", rows);
  const ids = inserted.map((row) => row.id);
  await saveTiersSafely(supabase, ids, tiers);
  return ids;
}

async function submitSeriesOwnerEvents(params: {
  ownerId: string;
  venueId: string;
  form: BusinessEventFormData;
  status: "pending_review" | "published";
  supabase: SupabaseClient;
}): Promise<string[]> {
  const { ownerId, venueId, form, status, supabase } = params;
  const tiers = normalizeTicketTiers(form.ticket_tiers ?? []);
  const now = new Date().toISOString();

  if (form.id) {
    return submitLegacyOwnerEvents(params);
  }

  const [series] = await insertRows(supabase, "event_series", {
    venue_id: venueId,
    title: form.title.trim(),
    description: form.description.trim(),
    event_type: form.event_type,
    neighborhood: form.neighborhood || null,
    image_url: form.image_url.trim() || null,
    submitted_by: ownerId,
    status,
    updated_at: now,
  });
  const seriesId = series.id;

  if (form.recurrence?.enabled && form.recurrence.by_weekday.length > 0 && form.recurrence.until_date) {
    await insertRows(supabase, "event_recurrence_rules", {
      series_id: seriesId,
      freq: "weekly",
      interval_weeks: form.recurrence.interval_weeks ?? 1,
      by_weekday: form.recurrence.by_weekday,
      until_date: form.recurrence.until_date,
    });
  }

  const rows = eventRowsFromOccurrences({
    ownerId,
    venueId,
    form,
    status,
    seriesId,
    now,
  });
  const inserted = await insertRows(supabase, "events", rows);
  const ids = inserted.map((row) => row.id);
  await saveTiersSafely(supabase, ids, tiers);
  return ids;
}

export async function listOwnerEvents(
  ownerId: string,
  venueId: string,
  supabase?: SupabaseClient,
): Promise<BusinessEventRow[]> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("events")
    .select(
      "id, venue_id, title, description, event_type, neighborhood, starts_at, ends_at, image_url, status, series_id, created_at, updated_at",
    )
    .eq("venue_id", venueId)
    .order("starts_at", { ascending: false });

  if (error) {
    if (error.message.includes("series_id")) {
      const admin = createAdminClient();
      const fallback = await admin
        .from("events")
        .select(
          "id, venue_id, title, description, event_type, neighborhood, starts_at, ends_at, image_url, status, created_at, updated_at",
        )
        .eq("venue_id", venueId)
        .order("starts_at", { ascending: false });
      if (fallback.error) throw fallback.error;
      return (fallback.data ?? []) as BusinessEventRow[];
    }
    throw error;
  }
  return (data ?? []) as BusinessEventRow[];
}

export async function getOwnerEvent(
  ownerId: string,
  venueId: string,
  eventId: string,
  supabase?: SupabaseClient,
): Promise<BusinessEventRow | null> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("events")
    .select(
      "id, venue_id, title, description, event_type, neighborhood, starts_at, ends_at, image_url, status, series_id, created_at, updated_at",
    )
    .eq("id", eventId)
    .eq("venue_id", venueId)
    .maybeSingle();

  if (error) throw error;
  return data as BusinessEventRow | null;
}

export async function submitOwnerEvents(params: {
  ownerId: string;
  venueId: string;
  form: BusinessEventFormData;
  status: "pending_review" | "published";
  supabase?: SupabaseClient;
}): Promise<string[]> {
  const { ownerId, venueId, form, status } = params;
  const supabase = params.supabase ?? (await createClient());

  try {
    return await submitSeriesOwnerEvents({ ownerId, venueId, form, status, supabase });
  } catch (err) {
    if (!isMissingRelationError(err)) throw err;
    return submitLegacyOwnerEvents({ ownerId, venueId, form, status, supabase });
  }
}
