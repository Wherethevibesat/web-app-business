import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FREE_RSVP_TIER_NAME,
  normalizeTicketTiers,
  type TicketTierInput,
} from "@/lib/types/ticket";

export async function saveTicketTiersForEvents(
  supabase: SupabaseClient,
  eventIds: string[],
  tiers: TicketTierInput[],
) {
  if (eventIds.length === 0) return;

  const normalized = normalizeTicketTiers(tiers);
  const rows = eventIds.flatMap((eventId) =>
    normalized.map((tier, index) => ({
      event_id: eventId,
      name: tier.name || (index === 0 ? FREE_RSVP_TIER_NAME : "Ticket"),
      description: tier.description?.trim() || "",
      price_cents: tier.price_cents,
      capacity: tier.capacity ?? null,
      sort_order: index,
      is_active: true,
      updated_at: new Date().toISOString(),
    })),
  );

  const { error } = await supabase.from("event_ticket_tiers").insert(rows);
  if (error) throw error;
}

export async function replaceTicketTiersForEvent(
  supabase: SupabaseClient,
  eventId: string,
  tiers: TicketTierInput[],
) {
  await supabase.from("event_ticket_tiers").delete().eq("event_id", eventId);
  await saveTicketTiersForEvents(supabase, [eventId], tiers);
}
