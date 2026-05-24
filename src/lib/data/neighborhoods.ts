import { createClient } from "@/lib/supabase/server";

const DEFAULT_CITY = "Houston";

export type NeighborhoodOption = {
  id: string;
  name: string;
  slug: string;
};

export async function listNeighborhoodOptions(): Promise<NeighborhoodOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id, name, slug")
    .eq("city", DEFAULT_CITY)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as NeighborhoodOption[];
}
