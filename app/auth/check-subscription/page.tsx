import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function CheckSubscriptionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) {
    redirect("/subscription")
  }

  const { data: team } = await supabase
    .from("teams")
    .select("subscription_status")
    .eq("id", membership.team_id)
    .single()

  if (!team || team.subscription_status !== "active") {
    redirect("/subscription")
  }

  redirect("/dashboard")
}