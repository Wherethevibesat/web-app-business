"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DriverPackageRow, DriverVehicleFormData, DriverVehicleRow } from "@/lib/types/driver";

function defaultPackage() {
  return {
    label: "",
    duration_hours: "2",
    price_dollars: "",
    description: "",
    is_active: true,
  };
}

export function VehicleForm({
  vehicleId,
  initial,
  packages: initialPackages,
}: {
  vehicleId?: string;
  initial?: DriverVehicleRow;
  packages?: DriverPackageRow[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<DriverVehicleFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    image_urls: initial?.image_urls ?? [],
    is_active: initial?.is_active ?? true,
    packages:
      initialPackages && initialPackages.length > 0
        ? initialPackages.map((p) => ({
            id: p.id,
            label: p.label,
            duration_hours: String(p.duration_hours),
            price_dollars: String(p.price_cents / 100),
            description: p.description ?? "",
            is_active: p.is_active,
          }))
        : [defaultPackage()],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updatePackage(i: number, patch: Partial<DriverVehicleFormData["packages"][0]>) {
    setForm((f) => ({
      ...f,
      packages: f.packages.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = vehicleId ? `/api/driver/vehicles/${vehicleId}` : "/api/driver/vehicles";
    const res = await fetch(url, {
      method: vehicleId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Save failed");
      return;
    }
    router.push("/driver/fleet");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div>
        <label className="text-sm font-medium">Vehicle name *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Stretch SUV"
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Capacity (passengers)</label>
        <input
          type="number"
          min={1}
          value={form.capacity}
          onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Packages *</h2>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, packages: [...f.packages, defaultPackage()] }))}
            className="text-sm underline"
          >
            Add package
          </button>
        </div>
        <p className="text-xs text-wtva-muted">e.g. 2 hours for $300</p>
        {form.packages.map((pkg, i) => (
          <div key={i} className="rounded-lg border border-wtva-dark-300 p-4 space-y-2">
            <input
              value={pkg.label}
              onChange={(e) => updatePackage(i, { label: e.target.value })}
              placeholder="Label (optional)"
              className="w-full rounded border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="number"
                step="0.5"
                min="0.5"
                value={pkg.duration_hours}
                onChange={(e) => updatePackage(i, { duration_hours: e.target.value })}
                placeholder="Hours"
                className="rounded border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                min="0"
                step="1"
                value={pkg.price_dollars}
                onChange={(e) => updatePackage(i, { price_dollars: e.target.value })}
                placeholder="Price ($)"
                className="rounded border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
              />
            </div>
            {form.packages.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, packages: f.packages.filter((_, idx) => idx !== i) }))
                }
                className="text-xs text-red-400"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Saving…" : vehicleId ? "Save vehicle" : "Add vehicle"}
      </button>
    </form>
  );
}
