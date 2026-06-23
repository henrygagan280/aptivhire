import type { SupabaseClient } from "@supabase/supabase-js"
import { PLAN_LIMITS, type PlanId } from "./plans"

export async function getUserTeam(supabase: SupabaseClient, userId: string) {
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!membership?.team_id) return null

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", membership.team_id)
    .single()

  return team
}

export async function checkTeamLimits(
  supabase: SupabaseClient,
  userId: string
) {
  const team = await getUserTeam(supabase, userId)

  if (!team) {
    return {
      allowed: false,
      reason: "No team found.",
      team: null,
      limits: PLAN_LIMITS.solo,
      usage: null,
    }
  }

  const plan = (team.plan || "solo") as PlanId
  const limits = PLAN_LIMITS[plan]

  const [
    jobsRes,
    membersRes,
    invitesRes,
    usageRes,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id),

    supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id),

    supabase
      .from("team_invites")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id)
      .eq("status", "pending"),

    supabase
      .from("subscription_usage")
      .select("analyses_used")
      .eq("team_id", team.id)
      .eq("month", new Date().toISOString().slice(0, 7))
      .single(),
  ])

  const usage = {
    jobs: jobsRes.count || 0,
    members: membersRes.count || 0,
    invites: invitesRes.count || 0,
    analysed: usageRes.data?.analyses_used || 0,
  }

  return {
    allowed: true,
    reason: "",
    team,
    limits,
    usage,
  }
}

export function canCreateJob(limits: any, usage: any) {
  if (limits.activeJobs === null) return true
  return usage.jobs < limits.activeJobs
}

export function canAnalyseCandidate(limits: any, usage: any) {
  if (limits.candidateAnalysesPerMonth === null) return true
  return usage.analysed < limits.candidateAnalysesPerMonth
}

export function canInviteUser(limits: any, usage: any) {
  if (limits.users === null) return true
  return usage.members + usage.invites < limits.users
}