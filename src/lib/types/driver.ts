export type DriverCompanyStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "suspended"
  | "cancelled";

export type DriverBookingStatus =
  | "pending_payment"
  | "pending_driver"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

export interface DriverCompanyRow {
  id: string;
  owner_id: string;
  company_name: string;
  description: string;
  contact_phone: string | null;
  contact_email: string | null;
  city: string | null;
  image_url: string | null;
  status: DriverCompanyStatus;
  published: boolean;
  listing_paid_at: string | null;
  listing_expires_at: string | null;
  listing_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverCompanyFormData {
  company_name: string;
  description: string;
  contact_phone: string;
  contact_email: string;
  city: string;
  image_url: string;
}

export interface DriverVehicleRow {
  id: string;
  company_id: string;
  name: string;
  description: string;
  capacity: number | null;
  image_urls: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DriverPackageRow {
  id: string;
  vehicle_id: string;
  label: string;
  duration_hours: number;
  price_cents: number;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface DriverVehicleFormData {
  name: string;
  description: string;
  capacity: string;
  image_urls: string[];
  is_active: boolean;
  packages: {
    id?: string;
    label: string;
    duration_hours: string;
    price_dollars: string;
    description: string;
    is_active: boolean;
  }[];
}

export interface DriverBookingRow {
  id: string;
  company_id: string;
  vehicle_id: string;
  package_id: string;
  customer_id: string;
  pickup_address: string;
  dropoff_address: string | null;
  scheduled_starts_at: string;
  duration_hours: number;
  price_cents: number;
  platform_fee_cents: number;
  driver_payout_cents: number;
  status: DriverBookingStatus;
  customer_notes: string;
  driver_notes: string;
  created_at: string;
  customer?: { name: string; email: string } | null;
  vehicle?: { name: string } | null;
}
