"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EventImageUpload } from "@/components/event-image-upload";
import { EventPaymentModal } from "@/components/event-payment-modal";
import { TicketTiersEditor } from "@/components/ticket-tiers-editor";
import { WEEKDAY_LABELS } from "@/lib/event-occurrences";
import type { PlatformSettings } from "@/lib/data/platform-settings";
import {
  DEFAULT_EVENT_TYPE,
  EVENT_TYPES,
  type BusinessEventFormData,
  type EventRecurrenceInput,
} from "@/lib/types/event";
import { FREE_RSVP_TIER_NAME } from "@/lib/types/ticket";

type NeighborhoodOption = { id: string; name: string; slug: string };

type EventFormProps = {
  ownerId: string;
  venueName: string;
  venueNeighborhood?: string | null;
  neighborhoods: NeighborhoodOption[];
  platformSettings: PlatformSettings;
  publishableKey: string | null;
  initial?: Partial<BusinessEventFormData>;
};

function toLocalDatetime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStartsAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(21, 0, 0, 0);
  return toLocalDatetime(d.toISOString());
}

function defaultEndsAt(startsLocal: string): string {
  const d = new Date(startsLocal);
  d.setHours(d.getHours() + 4);
  return toLocalDatetime(d.toISOString());
}

const defaultRecurrence = (): EventRecurrenceInput => ({
  enabled: false,
  by_weekday: [],
  until_date: "",
  interval_weeks: 1,
});

export function EventForm({
  ownerId,
  venueName,
  venueNeighborhood,
  neighborhoods,
  platformSettings,
  publishableKey,
  initial,
}: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<BusinessEventFormData>(() => ({
    id: initial?.id,
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    event_type: initial?.event_type ?? DEFAULT_EVENT_TYPE,
    neighborhood: initial?.neighborhood ?? venueNeighborhood ?? "",
    starts_at: initial?.starts_at ? toLocalDatetime(initial.starts_at) : defaultStartsAt(),
    ends_at: initial?.ends_at
      ? toLocalDatetime(initial.ends_at)
      : defaultEndsAt(initial?.starts_at ? toLocalDatetime(initial.starts_at) : defaultStartsAt()),
    image_url: initial?.image_url ?? "",
    additional_dates: initial?.additional_dates ?? [],
    recurrence: initial?.recurrence ?? defaultRecurrence(),
    ticket_tiers: initial?.ticket_tiers ?? [{ name: FREE_RSVP_TIER_NAME, price_cents: 0 }],
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const fee = platformSettings.event_submission_fee;
  const stripeConfigured = Boolean(publishableKey);
  const canPayToPublish = fee > 0 && stripeConfigured;
  const canFreeReview = !platformSettings.require_payment || fee <= 0;
  const canReviewWithoutStripe = platformSettings.require_payment && fee > 0 && !stripeConfigured;
  const showReviewSubmit = canFreeReview || canReviewWithoutStripe;

  const preview = useMemo(() => {
    if (!form.starts_at || !form.neighborhood) return null;
    const d = new Date(form.starts_at);
    const day = d.toLocaleDateString(undefined, { weekday: "short" });
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const extra =
      form.additional_dates.length > 0
        ? ` (+${form.additional_dates.length} more date${form.additional_dates.length === 1 ? "" : "s"})`
        : "";
    return `${form.event_type} · ${day} ${date}${extra} · ${form.neighborhood}`;
  }, [form]);

  function update<K extends keyof BusinessEventFormData>(key: K, value: BusinessEventFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addAdditionalDate() {
    update("additional_dates", [...form.additional_dates, ""]);
  }

  function setAdditionalDate(index: number, value: string) {
    const next = [...form.additional_dates];
    next[index] = value;
    update("additional_dates", next);
  }

  function removeAdditionalDate(index: number) {
    update(
      "additional_dates",
      form.additional_dates.filter((_, i) => i !== index),
    );
  }

  function toggleRecurrenceWeekday(day: number) {
    const current = form.recurrence ?? defaultRecurrence();
    const set = new Set(current.by_weekday);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    update("recurrence", { ...current, by_weekday: [...set].sort() });
  }

  function payload(mode: "paid" | "review", paymentIntentId?: string) {
    return {
      ...form,
      additional_dates: form.additional_dates.filter(Boolean),
      mode,
      paymentIntentId,
    };
  }

  async function submitForReview() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload("review")),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save event");
      return;
    }
    const body = await res.json();
    router.push(`/events?status=${body.status ?? "pending_review"}`);
    router.refresh();
  }

  async function publishWithPayment(paymentIntentId: string) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload("paid", paymentIntentId)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to publish event");
    }
    setPaymentOpen(false);
    router.push("/events?status=published");
    router.refresh();
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (platformSettings.require_payment && fee > 0 && stripeConfigured) {
      setError(`Payment of $${fee.toFixed(2)} is required to post events. Use pay & publish.`);
      return;
    }
    await submitForReview();
  }

  function handlePayClick() {
    if (!canPayToPublish) {
      setError("Stripe is not configured. Contact support or submit for review.");
      return;
    }
    setError(null);
    setPaymentOpen(true);
  }

  return (
    <>
      <form onSubmit={handleReviewSubmit} className="max-w-2xl space-y-5">
        <p className="text-sm text-wtva-muted">
          Events for <span className="font-semibold text-foreground">{venueName}</span> appear in
          customer search and filters once live.
          {canReviewWithoutStripe ? (
            <>
              {" "}
              Stripe is not configured — submit for admin review to post this event.
            </>
          ) : canPayToPublish ? (
            <>
              {" "}
              Pay <span className="font-semibold text-foreground">${fee.toFixed(2)}</span> to
              publish instantly, or submit for admin review
              {!canFreeReview ? " if payment is waived" : ""}.
            </>
          ) : (
            <> Submit for admin review before going live.</>
          )}
        </p>

        <EventImageUpload
          ownerId={ownerId}
          value={form.image_url}
          onChange={(image_url) => update("image_url", image_url)}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Event title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Event type *</label>
            <select
              required
              value={form.event_type}
              onChange={(e) => update("event_type", e.target.value)}
              className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Neighborhood *</label>
            <select
              required
              value={form.neighborhood}
              onChange={(e) => update("neighborhood", e.target.value)}
              className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
            >
              <option value="">Select neighborhood</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Start date & time *</label>
            <input
              required
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => update("starts_at", e.target.value)}
              className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End date & time</label>
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => update("ends_at", e.target.value)}
              className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Additional dates (optional)</label>
            <button
              type="button"
              onClick={addAdditionalDate}
              className="text-xs font-semibold text-wtva-muted hover:text-foreground"
            >
              + Add date
            </button>
          </div>
          <p className="mb-2 text-xs text-wtva-muted">
            Same start/end time — one listing per date (included in one posting fee).
          </p>
          {form.additional_dates.length === 0 ? (
            <p className="text-xs text-wtva-muted">No extra dates.</p>
          ) : (
            <div className="space-y-2">
              {form.additional_dates.map((value, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="date"
                    value={value}
                    onChange={(e) => setAdditionalDate(index, e.target.value)}
                    className="flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdditionalDate(index)}
                    className="rounded-lg border border-wtva-dark-300 px-3 text-sm text-wtva-muted hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.recurrence?.enabled ?? false}
              onChange={(e) =>
                update("recurrence", {
                  ...(form.recurrence ?? defaultRecurrence()),
                  enabled: e.target.checked,
                })
              }
            />
            Repeat weekly
          </label>
          {(form.recurrence?.enabled ?? false) && (
            <div className="space-y-3 rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 p-3">
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, day) => {
                  const active = form.recurrence?.by_weekday.includes(day) ?? false;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleRecurrenceWeekday(day)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        active
                          ? "bg-accent-gradient text-white shadow-accent"
                          : "border border-wtva-dark-300 text-wtva-muted"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <label className="block text-xs text-wtva-muted">
                Repeat until
                <input
                  type="date"
                  required={form.recurrence?.enabled}
                  value={form.recurrence?.until_date ?? ""}
                  onChange={(e) =>
                    update("recurrence", {
                      ...(form.recurrence ?? defaultRecurrence()),
                      until_date: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-500 px-3 py-2 text-sm"
                />
              </label>
              <p className="text-xs text-wtva-muted">
                Same start/end time each week — one listing per occurrence (one posting fee).
              </p>
            </div>
          )}
        </div>

        <TicketTiersEditor
          tiers={form.ticket_tiers ?? [{ name: FREE_RSVP_TIER_NAME, price_cents: 0 }]}
          onChange={(ticket_tiers) => update("ticket_tiers", ticket_tiers)}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          />
        </div>

        {preview && (
          <p className="rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-xs text-wtva-muted">
            Customer filters will match:{" "}
            <span className="font-semibold text-foreground">{preview}</span>
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="sticky bottom-20 z-40 -mx-4 border-t border-wtva-dark-300 bg-background/95 px-4 py-4 backdrop-blur md:bottom-0">
          <div className="flex flex-wrap gap-3">
            {fee > 0 && (
              <button
                type="button"
                onClick={handlePayClick}
                disabled={loading || !stripeConfigured}
                className="rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Pay ${fee.toFixed(2)} & publish now
              </button>
            )}
            {showReviewSubmit && (
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {loading
                  ? "Submitting…"
                  : form.id
                    ? "Update & resubmit for review"
                    : canReviewWithoutStripe
                      ? "Submit event for review"
                      : "Submit for review"}
              </button>
            )}
            {!showReviewSubmit && fee > 0 && !stripeConfigured && (
              <p className="text-xs text-wtva-muted self-center">
                Configure Stripe to pay and publish instantly.
              </p>
            )}
            <Link
              href="/events"
              className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </Link>
          </div>
        </div>
        <div className="h-4 md:h-0" aria-hidden />
      </form>

      {canPayToPublish && publishableKey && (
        <EventPaymentModal
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          form={form}
          fee={fee}
          publishableKey={publishableKey}
          onPublished={publishWithPayment}
        />
      )}
    </>
  );
}
