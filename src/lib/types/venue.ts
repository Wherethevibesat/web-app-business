import type { VenueOpeningHours } from "@/lib/types/opening-hours";

export type SubscriptionTier = "silver" | "gold" | "platinum";

export type BusinessVenueRow = {
  id: string;
  name: string;
  venue_type: string;
  address: string | null;
  neighborhood: string | null;
  description: string | null;
  image_url: string | null;
  phone: string | null;
  hours_label: string | null;
  opening_hours: VenueOpeningHours | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  subscription_tier: SubscriptionTier | null;
  verified: boolean | null;
  verification_status: string | null;
  published: boolean | null;
  listing_paid_at: string | null;
  listing_expires_at: string | null;
  is_open: boolean | null;
  owner_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type BusinessVenueFormData = {
  id?: string;
  name: string;
  venue_type: string;
  address: string;
  neighborhood: string;
  description: string;
  image_url: string;
  phone: string;
  hours_label: string;
  opening_hours: VenueOpeningHours;
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  twitter_url: string;
};

export const VENUE_TYPES = [
  "Nightclub",
  "Lounge",
  "Bar",
  "Restaurant",
  "Speakeasy",
  "Rooftop",
  "After Hours Club",
  "Hookah Lounge",
] as const;

export const DEFAULT_VENUE_TYPE = "Nightclub" as const;
