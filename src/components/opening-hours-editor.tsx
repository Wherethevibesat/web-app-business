"use client";

import {
  WEEKDAY_LABELS,
  WEEKDAYS,
  type VenueDayHours,
  type VenueOpeningHours,
  type Weekday,
} from "@/lib/types/opening-hours";

type OpeningHoursEditorProps = {
  value: VenueOpeningHours;
  onChange: (hours: VenueOpeningHours) => void;
};

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  function updateDay(day: Weekday, patch: Partial<VenueDayHours>) {
    onChange({
      ...value,
      [day]: { ...value[day], ...patch },
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Opening hours</p>
        <p className="text-xs text-wtva-muted">Set open and close times for each day of the week.</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-wtva-dark-300">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-wtva-dark-300 bg-wtva-dark-400/50 text-left text-wtva-muted">
              <th className="px-3 py-2 font-medium">Day</th>
              <th className="px-3 py-2 font-medium">Closed</th>
              <th className="px-3 py-2 font-medium">Opens</th>
              <th className="px-3 py-2 font-medium">Closes</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((day) => {
              const slot = value[day];
              return (
                <tr key={day} className="border-b border-wtva-dark-300 last:border-0">
                  <td className="px-3 py-2">{WEEKDAY_LABELS[day]}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={slot.closed}
                      onChange={(e) =>
                        updateDay(day, {
                          closed: e.target.checked,
                          open: e.target.checked ? null : slot.open ?? "21:00",
                          close: e.target.checked ? null : slot.close ?? "02:00",
                        })
                      }
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      disabled={slot.closed}
                      value={slot.open ?? ""}
                      onChange={(e) => updateDay(day, { open: e.target.value || null })}
                      className="rounded border border-wtva-dark-300 bg-wtva-dark-400 px-2 py-1 disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      disabled={slot.closed}
                      value={slot.close ?? ""}
                      onChange={(e) => updateDay(day, { close: e.target.value || null })}
                      className="rounded border border-wtva-dark-300 bg-wtva-dark-400 px-2 py-1 disabled:opacity-40"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
