import Link from "next/link";
import { browseTalent } from "@/lib/data/business";

export default async function BrowsePage() {
  const talent = await browseTalent().catch(() => []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Browse talent</h1>
      <p className="text-sm text-wtva-muted">Customers on WTVA</p>
      <ul className="mt-6 space-y-2">
        {talent.map((t) => (
          <li key={t.id}>
            <Link
              href={`/browse/${t.id}`}
              className="flex items-center justify-between rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-4 hover:border-foreground"
            >
              <span className="font-medium">{t.name}</span>
              <span className="text-sm text-wtva-muted">{t.email}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
