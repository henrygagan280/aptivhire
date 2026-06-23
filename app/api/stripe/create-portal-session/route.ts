import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership?.team_id) {
    return NextResponse.json({ error: "No team found" }, { status: 400 })
  }

  const { data: team } = await supabase
    .from("teams")
    .select("stripe_customer_id")
    .eq("id", membership.team_id)
    .single()

  const stripeCustomerId = team?.stripe_customer_id

  if (
    !stripeCustomerId ||
    stripeCustomerId === "NULL" ||
    stripeCustomerId === "null"
  ) {
    return NextResponse.json(
      {
        error:
          "No active Stripe subscription found. Please choose a plan first.",
      },
      { status: 400 }
    )
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return NextResponse.json({ url: session.url })
}