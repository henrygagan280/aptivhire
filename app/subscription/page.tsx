"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Check } from "lucide-react"
import { createClient } from "@/lib/supabase/browser"
import { getCurrentPlan } from "@/lib/subscription/get-current-plan"
import { PLAN_LIMITS } from "@/lib/subscription/plans"
import type { PlanId } from "@/lib/subscription/plans"

export default function SubscriptionPage() {
  const supabase = createClient()
  const [currentPlan, setCurrentPlan] = useState<PlanId>("solo")

  const handleChangePlan = async (planId: PlanId) => {
    console.log("Selected plan:", planId)
  }

  useEffect(() => {
    const loadPlan = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const plan = await getCurrentPlan(supabase, user.id)
      setCurrentPlan(plan)
    }

    loadPlan()
  }, [supabase])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 px-8 py-7">
          <h1 className="text-3xl font-bold text-slate-950">
            Choose your plan
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Upgrade AptivHire to unlock more jobs, more candidate analyses, and
            team collaboration.
          </p>

          <div className="mt-5 inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            Current plan:{" "}
            {PLAN_LIMITS[currentPlan].name}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {Object.values(PLAN_LIMITS).map((plan) => {
              const isCurrentPlan = currentPlan === plan.id
              const isRecommended = plan.id === "team"

              const features = [
                plan.users === null
                  ? "Unlimited users"
                  : `${plan.users} user${plan.users > 1 ? "s" : ""}`,

                plan.activeJobs === null
                  ? "Unlimited active jobs"
                  : `${plan.activeJobs} active jobs`,

                plan.candidateAnalysesPerMonth === null
                  ? "Unlimited candidate analyses"
                  : `${plan.candidateAnalysesPerMonth} candidate analyses/month`,
              ]

              return (
                <div
                  key={plan.id}
                  className={`rounded-[28px] border bg-white p-6 shadow-sm ${
                    isRecommended
                      ? "border-violet-300 ring-4 ring-violet-100"
                      : "border-slate-200"
                  }`}
                >
                  {isRecommended && (
                    <div className="mb-4 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                      Recommended
                    </div>
                  )}

                  <h2 className="text-2xl font-bold text-slate-950">
                    {plan.name}
                  </h2>

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {getPlanDescription(plan.id)}
                  </p>

                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-4xl font-bold text-slate-950">
                      {plan.price}
                    </span>
                    <span className="pb-1 text-sm font-medium text-slate-500">
                      /month
                    </span>
                  </div>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="mt-6 h-12 w-full rounded-2xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
  onClick={() => handleChangePlan(plan.id)}
  className="mt-6 h-12 w-full rounded-2xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700"
>
  {isPlanUpgrade(currentPlan, plan.id)
    ? `Upgrade to ${plan.name}`
    : `Switch to ${plan.name}`}
</button>
                  )}

                  <div className="mt-6 space-y-3">
                    {features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <Check size={18} className="text-violet-600" />
                        <span className="text-sm font-medium text-slate-600">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}

function getPlanDescription(planId: PlanId) {
  switch (planId) {
    case "solo":
      return "For independent recruiters and small business owners."
    case "team":
      return "For small recruitment teams ready to scale."
    case "agency":
      return "For agencies managing higher recruitment volume."
    default:
      return ""
  }
}

function isPlanUpgrade(currentPlan: PlanId, targetPlan: PlanId) {
  const order: PlanId[] = ["solo", "team", "agency"]

  return order.indexOf(targetPlan) > order.indexOf(currentPlan)
} 