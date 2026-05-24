import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { listBookings } from "@/lib/data/business";
import { formatCurrency } from "@/lib/utils";

export default async function BookingsPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const bookings = await listBookings(auth.user!.id).catch(() => []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Bookings</h1>
      <ul className="mt-6 space-y-2">
        {bookings.map((b) => (
          <li
            key={b.id}
            className="rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-4"
          >
            <div className="flex justify-between">
              <span className="font-medium">
                {(b.talent as { name?: string })?.name ?? "Talent"}
              </span>
              <span className="text-sm capitalize">{b.status}</span>
            </div>
            <p className="mt-1 text-sm text-wtva-muted">
              {new Date(b.event_at).toLocaleString()} · {formatCurrency(Number(b.amount))}
            </p>
          </li>
        ))}
      </ul>
      {bookings.length === 0 && (
        <p className="mt-4 text-wtva-muted">No bookings yet. Browse talent to invite.</p>
      )}
    </div>
  );
}
