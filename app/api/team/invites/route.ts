import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { sendInviteEmail } from "@/lib/email/send-invite-email"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

  const body = await req.json()
  const email = body.email?.trim().toLowerCase()
  const teamId = body.teamId

  if (!email || !teamId) {
    return NextResponse.json(
      { error: "Missing email or team ID." },
      { status: 400 }
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 })
  }

  const { data: membership } = await serviceSupabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Only team admins can invite users." },
      { status: 403 }
    )
  }

  const { data: team } = await serviceSupabase
    .from("teams")
    .select("id, name, plan, seat_limit")
    .eq("id", teamId)
    .single()

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 })
  }

  if (team.plan === "solo") {
    return NextResponse.json(
      { error: "Solo plans only include 1 account." },
      { status: 403 }
    )
  }

  const { count: memberCount } = await serviceSupabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)

  const { count: pendingInviteCount } = await serviceSupabase
    .from("team_invites")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "pending")

  const usedSeats = (memberCount || 0) + (pendingInviteCount || 0)
  const seatLimit = team.plan === "agency" ? 999999 : team.seat_limit || 1

  if (usedSeats >= seatLimit) {
    return NextResponse.json(
      { error: "You have reached your plan seat limit." },
      { status: 403 }
    )
  }

  const token = crypto.randomUUID()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error: inviteError } = await serviceSupabase
    .from("team_invites")
    .insert({
      team_id: teamId,
      email,
      role: "member",
      status: "pending",
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (inviteError) {
    console.error("Invite error:", inviteError)

    if (inviteError.code === "23505") {
      return NextResponse.json(
        { error: "This user has already been invited." },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Could not create invite." },
      { status: 500 }
    )
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`

try {
  const emailResult = await sendInviteEmail({
    email,
    teamName: team.name || "your team",
    inviteUrl,
  })

  return NextResponse.json({
    success: true,
    email,
    inviteUrl,
    resendResult: emailResult,
  })
} catch (emailError: any) {
  return NextResponse.json(
    {
      success: false,
      error:
        emailError?.message ||
        "Invite was created, but the email could not be sent.",
      details: emailError,
    },
    { status: 500 }
  )
}
}