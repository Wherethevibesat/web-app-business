import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import { getTalentProfile } from "@/lib/data/business";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";
import { tierForPoints } from "@/lib/ranking-rules";

export default async function TalentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const venue = await getOwnerVenue(auth.user!.id);
  const { user, points } = await getTalentProfile(userId);
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href="/browse" className="text-sm text-wtva-muted">← Browse</Link>
      <h1 className="mt-4 text-2xl font-bold">{user.name}</h1>
      <p className="text-wtva-muted">{points.toLocaleString()} points · {tierForPoints(points)}</p>
      {venue ? (
        <div className="mt-8">
          <BookingForm
            talentUserId={userId}
            venueId={venue.id as string}
          />
        </div>
      ) : (
        <p className="mt-4 text-amber-400">Link a venue to your account first (Settings).</p>
      )}
    </div>
  );
}
