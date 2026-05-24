"use client";

import {
  FREE_RSVP_TIER_NAME,
  formatTierPrice,
  normalizeTicketTiers,
  type TicketTierInput,
} from "@/lib/types/ticket";

type TicketTiersEditorProps = {
  tiers: TicketTierInput[];
  onChange: (tiers: TicketTierInput[]) => void;
};

export function TicketTiersEditor({ tiers, onChange }: TicketTiersEditorProps) {
  const normalized = normalizeTicketTiers(
    tiers.length ? tiers : [{ name: FREE_RSVP_TIER_NAME, price_cents: 0 }],
  );

  function update(index: number, patch: Partial<TicketTierInput>) {
    const next = normalized.map((t, i) => (i === index ? { ...t, ...patch } : t));
    onChange(normalizeTicketTiers(next));
  }

  function addPaidTier() {
    onChange([
      ...normalized,
      { name: "General Admission", description: "", price_cents: 2000, capacity: null },
    ]);
  }

  function remove(index: number) {
    if (index === 0) return;
    onChange(normalized.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Tickets & RSVP</label>
        <button
          type="button"
          onClick={addPaidTier}
          className="text-xs font-semibold text-wtva-muted hover:text-foreground"
        >
          + Add paid tier
        </button>
      </div>
      <p className="text-xs text-wtva-muted">
        First option is always Free RSVP. Add paid tiers with a name, price, and optional description.
      </p>
      {normalized.map((tier, index) => (
        <div
          key={index}
          className="rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 p-3 space-y-3"
        >
          <div className="flex gap-2">
            <input
              value={tier.name}
              disabled={index === 0}
              onChange={(e) => update(index, { name: e.target.value })}
              className="flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-dark-500 px-3 py-2 text-sm disabled:opacity-70"
              placeholder="Ticket name"
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-lg border border-wtva-dark-300 px-3 text-sm text-wtva-muted hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
          <textarea
            rows={2}
            value={tier.description ?? ""}
            onChange={(e) => update(index, { description: e.target.value })}
            placeholder={index === 0 ? "Optional RSVP details" : "Ticket description (optional)"}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-500 px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-wtva-muted">
              Price (USD)
              <input
                type="number"
                min={0}
                step={0.01}
                disabled={index === 0}
                value={index === 0 ? 0 : tier.price_cents / 100}
                onChange={(e) =>
                  update(index, {
                    price_cents: Math.round(Number(e.target.value || 0) * 100),
                  })
                }
                className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-500 px-3 py-2 text-sm disabled:opacity-70"
              />
            </label>
            <label className="text-xs text-wtva-muted">
              Capacity (optional)
              <input
                type="number"
                min={1}
                value={tier.capacity ?? ""}
                onChange={(e) =>
                  update(index, {
                    capacity: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Unlimited"
                className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-500 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <p className="text-xs text-wtva-muted">{formatTierPrice(tier.price_cents)}</p>
        </div>
      ))}
    </div>
  );
}
