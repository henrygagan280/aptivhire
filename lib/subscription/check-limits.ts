import { PLAN_LIMITS, type PlanId } from "./plans";

export function canCreateJob(plan: PlanId, currentActiveJobs: number) {
  const limit = PLAN_LIMITS[plan].activeJobs;

  if (limit === null) return true;

  return currentActiveJobs < limit;
}

export function canAnalyseCandidate(
  plan: PlanId,
  analysesUsedThisMonth: number
) {
  const limit = PLAN_LIMITS[plan].candidateAnalysesPerMonth;

  if (limit === null) return true;

  return analysesUsedThisMonth < limit;
}

export function canInviteUser(plan: PlanId, currentUsers: number) {
  const limit = PLAN_LIMITS[plan].users;

  if (limit === null) return true;

  return currentUsers < limit;
}