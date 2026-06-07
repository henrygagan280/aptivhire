import type { SupabaseClient } from "@supabase/supabase-js"
import type { PlanId } from "./plans"

export async function getCurrentPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanId> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single()

  if (error) {
  return "solo"
}

  return (data?.plan ?? "solo") as PlanId
}