import Link from "next/link";
import { requirePromoter } from "@/lib/auth/require-promoter";
import { listPromoterOffers } from "@/lib/data/promoter-offers";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default async function PromoterOffersPage() {
  const auth = await requirePromoter();
  if (auth.error) return null;

  const offers = await listPromoterOffers(auth.user!.id, auth.supabase);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Offers</h1>
        <Link
          href="/promoter/offers/new"
          className="rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
        >
          New offer
        </Link>
      </div>
      <ul className="mt-6 space-y-3">
        {offers.length === 0 ? (
          <li className="text-sm text-wtva-muted">No offers yet.</li>
        ) : (
          offers.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
            >
              <p className="font-semibold">{o.name}</p>
              <p className="text-wtva-muted">
                {formatPrice(o.price_cents)} · capacity {o.slots_used ?? 0}/{o.capacity} ·{" "}
                {o.event?.title}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
