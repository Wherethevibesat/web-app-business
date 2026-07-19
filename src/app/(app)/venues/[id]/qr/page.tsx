import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { CheckinQr } from "@/components/checkin-qr";

export default async function VenueQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const { id } = await params;

  const { data: venue } = await auth.supabase
    .from("venues")
    .select("id, name, check_in_token, require_check_in_qr")
    .eq("id", id)
    .eq("owner_id", auth.user!.id)
    .maybeSingle();

  if (!venue) notFound();

  const base =
    process.env.NEXT_PUBLIC_CUSTOMER_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3001";
  const checkInUrl = `${base}/check-in?venue=${encodeURIComponent(venue.id as string)}&token=${encodeURIComponent((venue.check_in_token as string) ?? "")}`;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link href="/venues" className="text-sm text-wtva-muted hover:text-foreground">
        ← Back to venues
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Check-in QR code</h1>
      <p className="mt-2 text-sm text-wtva-muted">
        Print this and display it at {venue.name as string}. Guests scan it to check in and earn
        points — pair it with the location check for tamper-resistant proof they were here.
      </p>
      <div className="mt-6">
        <CheckinQr
          venueId={venue.id as string}
          venueName={venue.name as string}
          checkInUrl={checkInUrl}
          initialRequire={Boolean(venue.require_check_in_qr)}
        />
      </div>
    </div>
  );
}
