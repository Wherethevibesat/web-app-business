import { createClient } from "@/lib/supabase/server";

export type PlatformSettings = {
  venue_submission_fee: number;
  venue_listing_months: number;
  event_submission_fee: number;
  require_payment: boolean;
  auto_approve_venues: boolean;
  auto_approve_events: boolean;
  driver_listing_fee: number;
  driver_listing_months: number;
  driver_booking_commission_pct: number;
};

const DEFAULTS: PlatformSettings = {
  venue_submission_fee: 50,
  venue_listing_months: 3,
  event_submission_fee: 25,
  require_payment: true,
  auto_approve_venues: false,
  auto_approve_events: false,
  driver_listing_fee: 50,
  driver_listing_months: 3,
  driver_booking_commission_pct: 10,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select(
      "venue_submission_fee, venue_listing_months, event_submission_fee, require_payment, auto_approve_venues, auto_approve_events, driver_listing_fee, driver_listing_months, driver_booking_commission_pct",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULTS;
  return {
    venue_submission_fee: Number(data.venue_submission_fee ?? DEFAULTS.venue_submission_fee),
    venue_listing_months: Number(data.venue_listing_months ?? DEFAULTS.venue_listing_months),
    event_submission_fee: Number(data.event_submission_fee ?? DEFAULTS.event_submission_fee),
    require_payment: Boolean(data.require_payment ?? DEFAULTS.require_payment),
    auto_approve_venues: Boolean(data.auto_approve_venues ?? DEFAULTS.auto_approve_venues),
    auto_approve_events: Boolean(data.auto_approve_events ?? DEFAULTS.auto_approve_events),
    driver_listing_fee: Number(data.driver_listing_fee ?? DEFAULTS.driver_listing_fee),
    driver_listing_months: Number(
      data.driver_listing_months ?? DEFAULTS.driver_listing_months,
    ),
    driver_booking_commission_pct: Number(
      data.driver_booking_commission_pct ?? DEFAULTS.driver_booking_commission_pct,
    ),
  };
}
