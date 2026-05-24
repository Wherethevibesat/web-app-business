import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export async function getPublishableKey(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stripe_settings")
    .select("publishable_key")
    .eq("id", 1)
    .maybeSingle();
  return data?.publishable_key ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}
