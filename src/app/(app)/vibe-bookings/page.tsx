import Link from "next/link";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { createClient } from "@/lib/supabase/server";
import { expireOverdueVibeRequests } from "@/lib/data/vibe-request-respond";
import { VibeBookingRespondButtons } from "@/components/vibe-booking-respond-buttons";

function money(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default async function VibeBookingsPage() {
  const auth = await requireVenueOwner();
  if (auth.error || !auth.user) {
    return (
      <div className="w-full">
        <p className="text-wtva-muted">Sign in as a venue owner to view bookings.</p>
      </div>
    );
  }

  await expireOverdueVibeRequests().catch(() => undefined);

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
      status: string;
      expires_at: string | null;
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
          starts_on, confirmation_code, status, expires_at,
          package:night_packages(title)
        )
      `,
      )
      .in("venue_id", venueIds)
      .order("created_at", { ascending: false })
      .limit(150);
    rows = (data as unknown as Row[]) ?? [];
  }

  const requests = rows.filter((r) => r.status === "pending_venue");
  const booked = rows.filter((r) => r.status !== "pending_venue");

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vibe bookings</h1>
          <p className="mt-1 text-sm text-wtva-muted">
            Confirm requests (guest contact stays hidden), then see paid bookings and codes.
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
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="text-lg font-bold">Requests</h2>
            <p className="mt-1 text-sm text-wtva-muted">
              Date, party size, and payout estimate only — no guest contact until they pay.
            </p>
            {requests.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-wtva-dark-300 px-4 py-6 text-sm text-wtva-muted">
                No open booking requests.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {requests.map((row) => {
                  const pkgTitle =
                    row.order?.package && typeof row.order.package === "object"
                      ? row.order.package.title
                      : "Vibe";
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
                          <h3 className="mt-1 font-bold">{row.title}</h3>
                          <p className="mt-1 text-sm text-wtva-muted">{pkgTitle}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold tabular-nums">
                            {money(row.venue_payout_cents)} est. payout
                          </p>
                          <p className="mt-1 text-wtva-muted">After guest pays</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-wtva-muted">
                        {[
                          row.order?.starts_on ? `Starts ${row.order.starts_on}` : null,
                          `${row.party_size} guests`,
                          row.order?.confirmation_code
                            ? `ref ${row.order.confirmation_code}`
                            : null,
                          row.order?.expires_at
                            ? `respond by ${new Date(row.order.expires_at).toLocaleString()}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <VibeBookingRespondButtons stopId={row.id} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold">Booked</h2>
            {booked.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-wtva-dark-300 px-4 py-6 text-sm text-wtva-muted">
                Paid vibe bookings will show here with redemption codes.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {booked.map((row) => {
                  const pkgTitle =
                    row.order?.package && typeof row.order.package === "object"
                      ? row.order.package.title
                      : "Curated vibe";
                  const showCode =
                    row.order?.status === "paid" || row.order?.status === "awaiting_payment";
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
                          <h3 className="mt-1 font-bold">{row.title}</h3>
                          <p className="mt-1 text-sm text-wtva-muted">{pkgTitle}</p>
                        </div>
                        <div className="text-right text-sm">
                          {showCode && row.order?.status === "paid" ? (
                            <p className="font-mono font-bold text-accent">
                              {row.redemption_code}
                            </p>
                          ) : (
                            <p className="text-wtva-muted capitalize">
                              {row.order?.status?.replace(/_/g, " ") ?? row.status}
                            </p>
                          )}
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
          </section>
        </div>
      )}
    </div>
  );
}
