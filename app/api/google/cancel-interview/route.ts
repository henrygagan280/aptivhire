import { NextResponse } from "next/server"
import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { calendarEventId } = await request.json()

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { data: connection } = await supabase
      .from("google_connections")
      .select("access_token, refresh_token")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!connection) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
    })

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    })

    await calendar.events.delete({
      calendarId: "primary",
      eventId: calendarEventId,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Could not cancel interview",
      },
      {
        status: 500,
      }
    )
  }
}