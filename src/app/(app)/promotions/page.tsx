import Link from "next/link";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { listPromotions } from "@/lib/data/business";

export default async function PromotionsPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const promos = await listPromotions(auth.user!.id).catch(() => []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <Link href="/promotions/new" className="rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white">
          New
        </Link>
      </div>
      <ul className="mt-6 space-y-2">
        {promos.map((p) => (
          <li key={p.id} className="rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-4">
            <p className="font-medium">{p.title}</p>
            <p className="text-sm text-wtva-muted capitalize">{p.status}</p>
          </li>
        ))}
      </ul>
      {promos.length === 0 && <p className="mt-4 text-wtva-muted">No promotions yet.</p>}
    </div>
  );
}
