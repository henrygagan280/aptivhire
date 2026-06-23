import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { plan } = await req.json()

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

    let priceId = ""

    switch (plan) {
      case "solo":
        priceId = process.env.STRIPE_SOLO_PRICE_ID!
        break
      case "team":
        priceId = process.env.STRIPE_TEAM_PRICE_ID!
        break
      case "agency":
        priceId = process.env.STRIPE_AGENCY_PRICE_ID!
        break
      default:
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        teamId: membership.team_id,
        plan,
      },
      subscription_data: {
        metadata: {
          teamId: membership.team_id,
          plan,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/confirm-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}