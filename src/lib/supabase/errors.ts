export function serializeSupabaseError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const row = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    if (typeof row.message === "string" && row.message.trim()) {
      const details = typeof row.details === "string" ? row.details.trim() : "";
      if (details) return `${row.message} (${details})`;
      if (row.code === "PGRST205") {
        return "Database schema is out of date. Ask an admin to run migration 010_event_series_tickets.sql in Supabase.";
      }
      return row.message;
    }
  }
  return fallback;
}

export function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const row = err as { code?: string; message?: string };
  if (row.code === "PGRST205") return true;
  const message = row.message ?? "";
  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}
