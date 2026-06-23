import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data: invite } = await supabase
    .from("team_invites")
    .select("email, status, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 })
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Invite already used" }, { status: 400 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 400 })
  }

  return NextResponse.json({ email: invite.email })
}