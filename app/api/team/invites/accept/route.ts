import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.redirect(
      new URL(`/signup?invite_token=${token}`, req.url)
    )
  }

  const { data: invite } = await serviceSupabase
    .from("team_invites")
    .select("id, email, team_id, status, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (!invite) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (invite.status !== "pending") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
  return NextResponse.redirect(
    new URL(`/login?invite_token=${token}`, req.url)
  )
}

  const { data: team } = await serviceSupabase
    .from("teams")
    .select("plan, seat_limit, subscription_status")
    .eq("id", invite.team_id)
    .maybeSingle()

  const hasActivePlan =
    team?.subscription_status === "active" ||
    team?.subscription_status === "trialing"

  if (!hasActivePlan) {
    return NextResponse.redirect(new URL("/subscription", req.url))
  }

  const { data: existingMember } = await serviceSupabase
    .from("team_members")
    .select("id")
    .eq("team_id", invite.team_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!existingMember) {
    const { error: memberError } = await serviceSupabase
      .from("team_members")
      .insert({
        team_id: invite.team_id,
        user_id: user.id,
        role: "member",
      })

    if (memberError) {
      console.error("Could not add team member:", memberError)
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }



  await serviceSupabase
    .from("team_invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id)

  return NextResponse.redirect(new URL("/dashboard", req.url))
}