import { NextResponse } from "next/server"

import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

function makeRawEmail({
  to,
  subject,
  message,
}: {
  to: string
  subject: string
  message: string
}) {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    message,
  ].join("\n")

  return Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export async function POST(req: Request) {
  try {
    const { to, subject, message } = await req.json()

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing to, subject, or message" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json(
    { error: "Not logged in" },
    { status: 401 }
  )
}

const { data: connection, error: connectionError } = await supabase
  .from("google_connections")
  .select("access_token, refresh_token")
  .eq("user_id", user.id)
  .single()

if (connectionError || !connection) {
  return NextResponse.json(
    { error: "Gmail is not connected" },
    { status: 401 }
  )
}

const accessToken = connection.access_token
const refreshToken = connection.refresh_token

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    })

    const raw = makeRawEmail({
      to,
      subject,
      message,
    })

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Failed to send Gmail reply:", error)

    return NextResponse.json(
      { error: "Failed to send Gmail reply" },
      { status: 500 }
    )
  }
}