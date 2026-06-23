export async function hasActiveSubscription(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership?.team_id) return false

  const { data: team } = await supabase
    .from("teams")
    .select("subscription_status")
    .eq("id", membership.team_id)
    .single()

  const allowedStatuses = ["active", "trialing"]

  return !!team && allowedStatuses.includes(team.subscription_status)
}