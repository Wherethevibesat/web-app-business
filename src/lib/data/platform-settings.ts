import { createClient } from "@/lib/supabase/server";

export type PlatformSettings = {
  event_submission_fee: number;
  require_payment: boolean;
  auto_approve_events: boolean;
};

const DEFAULTS: PlatformSettings = {
  event_submission_fee: 25,
  require_payment: true,
  auto_approve_events: false,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("event_submission_fee, require_payment, auto_approve_events")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULTS;
  return {
    event_submission_fee: Number(data.event_submission_fee ?? DEFAULTS.event_submission_fee),
    require_payment: Boolean(data.require_payment ?? DEFAULTS.require_payment),
    auto_approve_events: Boolean(data.auto_approve_events ?? DEFAULTS.auto_approve_events),
  };
}
