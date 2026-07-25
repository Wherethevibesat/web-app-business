import Link from "next/link";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { createClient } from "@/lib/supabase/server";

function money(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default async function VibeBookingsPage() {
  const auth = await requireVenueOwner();
  if (auth.error || !auth.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-wtva-muted">Sign in as a venue owner to view bookings.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", auth.user.id);

  const venueIds = (venues ?? []).map((v) => v.id as string);
  const venueName = new Map(
    (venues ?? []).map((v) => [v.id as string, (v.name as string) || "Venue"]),
  );

  type Row = {
    id: string;
    title: string;
    redemption_code: string;
    venue_payout_cents: number;
    party_size: number;
    status: string;
    payout_status: string | null;
    venue_id: string;
    created_at: string;
    order: {
      starts_on: string | null;
      confirmation_code: string;
      package: { title: string } | null;
    } | null;
  };

  let rows: Row[] = [];
  if (venueIds.length) {
    const { data } = await supabase
      .from("night_package_order_stops")
      .select(
        `
        id, title, redemption_code, venue_payout_cents, party_size, status,
        payout_status, venue_id, created_at,
        order:night_package_orders(
          starts_on, confirmation_code,
          package:night_packages(title)
        )
      `,
      )
      .in("venue_id", venueIds)
      .order("created_at", { ascending: false })
      .limit(100);
    rows = (data as unknown as Row[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vibe bookings</h1>
          <p className="mt-1 text-sm text-wtva-muted">
            Guest bookings that include your experiences — codes, dates, and payouts.
          </p>
        </div>
        <Link href="/package-stops" className="text-sm font-semibold text-accent">
          Manage offers →
        </Link>
      </div>

      {!venueIds.length ? (
        <p className="mt-8 rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6 text-sm text-wtva-muted">
          No venues linked to this account yet.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6 text-sm text-wtva-muted">
          No vibe bookings yet. When guests book a curated vibe that includes your offer,
          it will show up here.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((row) => {
            const pkgTitle =
              row.order?.package && typeof row.order.package === "object"
                ? row.order.package.title
                : "Curated vibe";
            return (
              <li
                key={row.id}
                className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-accent">
                      {venueName.get(row.venue_id) ?? "Venue"}
                    </p>
                    <h2 className="mt-1 font-bold">{row.title}</h2>
                    <p className="mt-1 text-sm text-wtva-muted">{pkgTitle}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-mono font-bold text-accent">
                      {row.redemption_code}
                    </p>
                    <p className="mt-1 text-wtva-muted">
                      {money(row.venue_payout_cents)} payout
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-wtva-muted">
                  {[
                    row.order?.starts_on ? `Starts ${row.order.starts_on}` : null,
                    `${row.party_size} guests`,
                    row.status,
                    row.payout_status ? `payout: ${row.payout_status}` : null,
                    row.order?.confirmation_code
                      ? `order ${row.order.confirmation_code}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
