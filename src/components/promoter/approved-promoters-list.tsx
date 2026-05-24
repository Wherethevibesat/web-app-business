"use client";

type LinkRow = {
  id: string;
  venue_id: string;
  status: string;
  requested_at: string;
  venue?: { id: string; name: string } | null;
  promoter?: { id: string; name: string; email: string } | null;
};

export function ApprovedPromotersList({ links }: { links: LinkRow[] }) {
  const approved = links.filter((l) => l.status === "approved");

  if (approved.length === 0) {
    return (
      <p className="text-sm text-wtva-muted">No approved promoters linked to your venues yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {approved.map((l) => (
        <li
          key={l.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium">{l.promoter?.name ?? "Promoter"}</p>
            <p className="text-wtva-muted">{l.promoter?.email}</p>
          </div>
          <span className="text-wtva-muted">{l.venue?.name ?? l.venue_id}</span>
        </li>
      ))}
    </ul>
  );
}
