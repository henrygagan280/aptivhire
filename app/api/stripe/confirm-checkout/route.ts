import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

function getPlanFromPrice(priceId: string) {
  if (priceId === process.env.STRIPE_SOLO_PRICE_ID) {
    return { plan: "solo", seat_limit: 1 }
  }

  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) {
    return { plan: "team", seat_limit: 5 }
  }

  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
    return { plan: "agency", seat_limit: null }
  }

  return { plan: "free", seat_limit: 1 }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.redirect(new URL("/subscription", req.url))
  }

  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== "paid") {
    return NextResponse.redirect(new URL("/subscription", req.url))
  }

  const subscriptionId = session.subscription as string

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const priceId = subscription.items.data[0].price.id
  const { plan, seat_limit } = getPlanFromPrice(priceId)

  const teamId = session.metadata?.teamId || subscription.metadata?.teamId

  if (!teamId) {
    return NextResponse.redirect(new URL("/subscription", req.url))
  }

  const { data: membership } = await serviceSupabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.redirect(new URL("/subscription", req.url))
  }

  await serviceSupabase
    .from("teams")
    .update({
      plan,
      seat_limit,
      subscription_status: subscription.status,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_end: new Date(
        subscription.items.data[0].current_period_end * 1000
      ).toISOString(),
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    })
    .eq("id", teamId)

  return NextResponse.redirect(new URL("/settings?success=true", req.url))
}