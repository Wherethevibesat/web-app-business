import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageStopForm } from "@/components/package-stop-form";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";

export default async function EditPackageStopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  if (!venue) notFound();

  const { data: stop, error } = await auth.supabase
    .from("package_stop_offers")
    .select("*")
    .eq("id", id)
    .eq("venue_id", venue.id)
    .maybeSingle();
  if (error || !stop) notFound();

  return (
    <div className="w-full">
      <Link href="/package-stops" className="text-sm text-wtva-muted hover:text-foreground">
        ← Package stops
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Edit package stop</h1>
      <p className="mt-1 text-sm text-wtva-muted capitalize">
        Status: {String(stop.status).replace(/_/g, " ")}
        {stop.diy_pool ? " · DIY pool live" : ""}
      </p>
      <div className="mt-6">
        <PackageStopForm
          initial={{
            id: stop.id,
            title: stop.title,
            description: stop.description,
            slot_type: stop.slot_type,
            price_cents: stop.price_cents,
            inclusions: stop.inclusions ?? [],
            capacity: stop.capacity,
            arrival_window: stop.arrival_window,
            image_url: stop.image_url,
            why_picked: stop.why_picked,
            duration_label: stop.duration_label,
            dress_code: stop.dress_code,
            crowd_label: stop.crowd_label,
            contract_accepted: stop.contract_accepted,
            diy_pool: Boolean(stop.diy_pool),
          }}
        />
      </div>
    </div>
  );
}
