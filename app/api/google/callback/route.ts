import { NextResponse } from "next/server"
import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(
  `${process.env.NEXT_PUBLIC_APP_URL}/emails?connected=false`
)
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
  `${process.env.NEXT_PUBLIC_APP_URL}/login`
)
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.redirect(
  `${process.env.NEXT_PUBLIC_APP_URL}/emails?connected=false`
)
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)

    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    })

    const { data: googleUser } = await oauth2.userinfo.get()

    await supabase.from("google_connections").upsert(
      {
        user_id: user.id,
        team_id: membership.team_id,
        google_email: googleUser.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )

    return NextResponse.redirect(
  `${process.env.NEXT_PUBLIC_APP_URL}/emails?connected=true`
)
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(
  `${process.env.NEXT_PUBLIC_APP_URL}/emails?connected=error`
)
  }
}