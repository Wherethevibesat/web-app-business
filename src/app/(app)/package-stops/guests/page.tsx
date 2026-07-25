import Link from "next/link";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";

export default async function PackageGuestsPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  if (!venue) {
    return (
      <div className="w-full">
        <p className="text-wtva-muted">Link a venue to see package guests.</p>
      </div>
    );
  }

  const { data: guests } = await auth.supabase
    .from("night_package_order_stops")
    .select(
      `
      id, title, slot_type, party_size, scheduled_label, redemption_code, status, created_at,
      order:night_package_orders(confirmation_code, guest_name, guest_email, status, paid_at)
    `,
    )
    .eq("venue_id", venue.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = guests ?? [];

  return (
    <div className="w-full">
      <Link href="/package-stops" className="text-sm text-wtva-muted hover:text-foreground">
        ← Package stops
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Package guests</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        Guests who booked a Build Your Night package that includes your venue.
      </p>

      <ul className="mt-6 space-y-2">
        {rows.map((row) => {
          const order = row.order as
            | {
                confirmation_code: string;
                guest_name: string | null;
                status: string;
                paid_at: string | null;
              }
            | {
                confirmation_code: string;
                guest_name: string | null;
                status: string;
                paid_at: string | null;
              }[]
            | null;
          const orderRow = Array.isArray(order) ? order[0] : order;
          return (
            <li
              key={row.id}
              className="rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-wtva-muted">
                    {row.party_size} guests
                    {row.scheduled_label ? ` · ${row.scheduled_label}` : ""}
                    {orderRow?.guest_name ? ` · ${orderRow.guest_name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold">{row.redemption_code}</p>
                  <p className="text-xs text-wtva-muted capitalize">{row.status}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 && (
        <p className="mt-6 text-wtva-muted">No package guests yet.</p>
      )}
    </div>
  );
}
