export type PromoterVenueLinkStatus = "pending" | "approved" | "rejected";
export type PromoterInquiryStatus =
  | "pending"
  | "reserved"
  | "booked"
  | "declined"
  | "cancelled";

export interface PromoterProfileRow {
  user_id: string;
  display_name: string;
  bio: string;
  contact_phone: string | null;
  contact_email: string | null;
  profile_image_url: string | null;
  slug: string | null;
}

export interface PromoterVenueLinkRow {
  id: string;
  promoter_id: string;
  venue_id: string;
  status: PromoterVenueLinkStatus;
  requested_at: string;
  reviewed_at: string | null;
  notes: string;
  venue?: { id: string; name: string } | null;
}

export interface PromoterOfferRow {
  id: string;
  promoter_id: string;
  venue_id: string;
  event_id: string;
  name: string;
  description: string;
  price_cents: number;
  capacity: number;
  allow_pay: boolean;
  allow_inquire: boolean;
  is_active: boolean;
  created_at: string;
  event?: { id: string; title: string; starts_at: string } | null;
  venue?: { id: string; name: string } | null;
  slots_used?: number;
}

export interface PromoterInquiryRow {
  id: string;
  offer_id: string;
  promoter_id: string;
  event_id: string;
  customer_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  party_size: number | null;
  arrival_time: string | null;
  notes: string;
  status: PromoterInquiryStatus;
  deposit_cents: number;
  promoter_notes: string;
  created_at: string;
  offer?: { name: string; price_cents: number } | null;
  event?: { title: string; starts_at: string } | null;
}

export interface PromoterProfileInquiryRow {
  id: string;
  promoter_id: string;
  customer_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  party_size: number | null;
  preferred_event: string;
  notes: string;
  status: PromoterInquiryStatus;
  promoter_notes: string;
  created_at: string;
}

export interface PromoterOfferFormData {
  event_id: string;
  venue_id: string;
  name: string;
  description: string;
  price_dollars: string;
  capacity: string;
  allow_pay: boolean;
  allow_inquire: boolean;
}

export interface PromoterEventFormData {
  venue_id: string;
  title: string;
  description: string;
  event_type: string;
  neighborhood: string;
  starts_at: string;
  ends_at: string;
}
