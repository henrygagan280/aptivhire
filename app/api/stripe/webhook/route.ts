import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function getPlanFromPrice(priceId: string) {
  if (priceId === process.env.STRIPE_SOLO_PRICE_ID) {
    return { plan: "solo", seat_limit: 1 };
  }

  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) {
    return { plan: "team", seat_limit: 5 };
  }

  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
    return { plan: "agency", seat_limit: null };
  }

  return { plan: "free", seat_limit: 1 };
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription =
      event.type === "checkout.session.completed"
        ? await stripe.subscriptions.retrieve(
            (event.data.object as Stripe.Checkout.Session)
              .subscription as string
          )
        : (event.data.object as Stripe.Subscription);

    const priceId = subscription.items.data[0].price.id;
    const { plan, seat_limit } = getPlanFromPrice(priceId);

    const teamId = subscription.metadata.teamId;

    if (teamId) {

  const currentPeriodStart = new Date(
    subscription.items.data[0].current_period_start * 1000
  ).toISOString()

  const { data: team } = await supabase
    .from("teams")
    .select("current_period_start")
    .eq("id", teamId)
    .single()

  await supabase
  .from("teams")
  .update({
    plan,
    seat_limit,
    subscription_status: subscription.status,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    current_period_start: currentPeriodStart,
    current_period_end: new Date(
      subscription.items.data[0].current_period_end * 1000
    ).toISOString(),
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  })
  .eq("id", teamId)

  if (
    team?.current_period_start &&
    team.current_period_start !== currentPeriodStart
  ) {
    await supabase
      .from("subscription_usage")
      .delete()
      .eq("team_id", teamId)
  }
}
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await supabase
      .from("teams")
      .update({
        plan: "free",
        seat_limit: 1,
        subscription_status: "cancelled",
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
current_period_end: null,
trial_ends_at: null,
      })
      .eq("stripe_subscription_id", subscription.id);
  }

  return NextResponse.json({ received: true });
}