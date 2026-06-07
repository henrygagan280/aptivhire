import { NextResponse } from "next/server"
import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const {
  candidateName,
  candidateEmail,
  jobTitle,
  slot,
  location,
  interviewType,
} = await request.json()

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: connection, error } = await supabase
      .from("google_connections")
      .select("access_token, refresh_token, google_email")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error || !connection) {
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

    const start = new Date(slot)
    const end = new Date(start.getTime() + 30 * 60 * 1000)

    const event = await calendar.events.insert({
  calendarId: "primary",

  ...(interviewType === "google_meet"
    ? { conferenceDataVersion: 1 }
    : {}),

  requestBody: {
    summary: `Interview: ${candidateName} — ${jobTitle}`,
    description: `Interview with ${candidateName} for ${jobTitle}.\n\nCandidate email: ${candidateEmail}`,

    start: {
  dateTime: start.toISOString(),
  timeZone: "Europe/London",
},

end: {
  dateTime: end.toISOString(),
  timeZone: "Europe/London",
},

    attendees: [
      {
        email: candidateEmail,
      },
    ],

    location:
      interviewType === "in_person"
        ? location
        : "Google Meet",

    ...(interviewType === "google_meet"
      ? {
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
            },
          },
        }
      : {}),
  },
})

    const meetingLink =
  interviewType === "google_meet"
    ? (
        event.data.hangoutLink ||
        event.data.conferenceData?.entryPoints?.find(
          (entry) => entry.entryPointType === "video"
        )?.uri ||
        ""
      )
    : ""

    return NextResponse.json({
      meetingLink,
      calendarEventId: event.data.id,
    })
  } catch (error) {
    console.error("Create interview event error:", error)

    return NextResponse.json(
  {
    error:
      error instanceof Error
        ? error.message
        : "Could not create Google Calendar event",
  },
  { status: 500 }
)
  }
}