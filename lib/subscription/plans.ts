export type PlanId = "solo" | "team" | "agency"

export const PLAN_LIMITS = {
  solo: {
    id: "solo",
    name: "Solo",
    price: "£19",
    users: 1,
    activeJobs: 5,
    candidateAnalysesPerMonth: 100,
  },
  team: {
    id: "team",
    name: "Team",
    price: "£59",
    users: 5,
    activeJobs: 25,
    candidateAnalysesPerMonth: 500,
  },
  agency: {
    id: "agency",
    name: "Agency",
    price: "£149",
    users: null,
    activeJobs: null,
    candidateAnalysesPerMonth: null,
  },
} as const