import type { SupabaseClient } from "@supabase/supabase-js"
import type { PlanId } from "./plans"

export async function getCurrentPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanId | null> {
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!membership?.team_id) return null

  const { data: team } = await supabase
    .from("teams")
    .select("plan, subscription_status")
    .eq("id", membership.team_id)
    .maybeSingle()

  const hasActivePlan =
    team?.subscription_status === "active" ||
    team?.subscription_status === "trialing"

  if (!hasActivePlan) return null

  if (
    team?.plan === "solo" ||
    team?.plan === "team" ||
    team?.plan === "agency"
  ) {
    return team.plan
  }

  return null
}