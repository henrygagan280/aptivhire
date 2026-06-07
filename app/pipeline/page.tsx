"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  Calendar,
  CheckCircle2,
  Filter,
  Mail,
  Search,
  Users,
  XCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/browser"



type CandidateStatus =
  | "Screening"
  | "Contacted"
  | "Interview"
  | "Offer"
  | "Rejected"

type Candidate = {
  rank?: number
  candidateId?: string
  candidateName?: string
  name?: string
  email?: string
  score?: number
  recommendation?: string
  roleTitle?: string
  candidateStatus?: CandidateStatus
  status?: string
  lastUpdated?: string
  communicationStatus?: string
}

type SavedJob = {
  id: string
  title: string
  company: string
  location: string
  description: string
  source: "manual" | "indeed" | "totaljobs"
  createdAt: string
}

const columns: {
  title: CandidateStatus
  dot: string
  soft: string
  accent: string
}[] = [
  
  {
    title: "Contacted",
    dot: "bg-violet-500",
    soft: "bg-violet-50",
    accent: "border-violet-200",
  },
  {
    title: "Interview",
    dot: "bg-indigo-500",
    soft: "bg-indigo-50",
    accent: "border-indigo-200",
  },
  {
    title: "Offer",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50",
    accent: "border-emerald-200",
  },
  {
    title: "Rejected",
    dot: "bg-red-500",
    soft: "bg-red-50",
    accent: "border-red-200",
  },
]

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [jobs, setJobs] = useState<SavedJob[]>([])
  const [jobFilter, setJobFilter] = useState("All")
  const [sortBy, setSortBy] = useState("Last Updated")
  const [activity, setActivity] = useState<string[]>([])
  
  const supabase = createClient()
const [teamId, setTeamId] = useState<string | null>(null)
const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
  const loadAccountData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single()

    if (!membership) return

    setTeamId(membership.team_id)

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .eq("team_id", membership.team_id)
      .order("created_at", { ascending: false })

    setJobs(
      (jobsData || []).map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company ?? "",
        location: job.location ?? "",
        description: job.description ?? "",
        source: job.source ?? "manual",
        createdAt: job.created_at,
      }))
    )

    const { data: pipelineData } = await supabase
      .from("pipeline")
      .select("*")
      .eq("team_id", membership.team_id)
      .order("updated_at", { ascending: false })

    setCandidates(
  (pipelineData || []).map((item) => ({
    candidateId: item.candidate_id,
    rank: undefined,
        candidateName: item.candidate_name ?? "",
        email: item.candidate_email ?? "",
        roleTitle: item.role_title ?? "",
        score: Number(item.score || 0),
        recommendation: item.recommendation ?? "",
        candidateStatus: item.status as CandidateStatus,
        communicationStatus: item.communication_status ?? "No email sent",
        lastUpdated: item.last_updated ?? "",
      }))
    )

    const savedActivity = localStorage.getItem("aptivhire-activity")
    if (savedActivity) {
      setActivity(JSON.parse(savedActivity))
    }
  }

  loadAccountData()
}, [])

  const saveCandidates = (updated: Candidate[]) => {
  setCandidates(updated)
}

  const addActivity = (message: string) => {
    const updated = [message, ...activity].slice(0, 6)
    setActivity(updated)
    localStorage.setItem("aptivhire-activity", JSON.stringify(updated))
  }

  const moveCandidate = async (
  candidate: Candidate,
  newStatus: CandidateStatus
) => {
  if (!teamId) return

  const candidateName =
    candidate.candidateName || candidate.name || "Candidate"

  const candidateId = getCandidateId(candidate)

  const communicationStatus =
    newStatus === "Interview"
      ? "Invite sent"
      : newStatus === "Rejected"
        ? "Rejection sent"
        : candidate.communicationStatus || "No email sent"

  const lastUpdated = "Updated just now"

  const { error } = await supabase
    .from("pipeline")
    .upsert(
      {
        team_id: teamId,
        candidate_id: candidateId,
        candidate_name: candidateName,
        candidate_email: candidate.email || "",
        role_title: candidate.roleTitle || "Unknown Job",
        score: candidate.score || 0,
        recommendation: candidate.recommendation || "",
        status: newStatus,
        communication_status: communicationStatus,
        last_updated: lastUpdated,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "team_id,candidate_id",
      }
    )

  if (error) {
    console.error("Failed to update pipeline:", error)
    alert("Could not update pipeline.")
    return
  }

  const updated = candidates.map((item) =>
    getCandidateId(item) === candidateId
      ? {
          ...item,
          candidateStatus: newStatus,
          lastUpdated,
          communicationStatus,
        }
      : item
  )

  setCandidates(updated)
  addActivity(`${candidateName} moved to ${newStatus}`)
}

  const markReplied = async (candidate: Candidate) => {
  if (!teamId) return

  const candidateName =
    candidate.candidateName || candidate.name || "Candidate"

  const candidateId = getCandidateId(candidate)

  const { error } = await supabase
    .from("pipeline")
    .update({
      communication_status: "Replied",
      last_updated: "Replied just now",
      updated_at: new Date().toISOString(),
    })
    .eq("team_id", teamId)
    .eq("candidate_id", candidateId)

  if (error) {
    console.error("Failed to mark replied:", error)
    alert("Could not mark candidate as replied.")
    return
  }

  const updated = candidates.map((item) =>
    getCandidateId(item) === candidateId
      ? {
          ...item,
          communicationStatus: "Replied",
          lastUpdated: "Replied just now",
        }
      : item
  )

  setCandidates(updated)
  addActivity(`${candidateName} marked as replied`)
}

  const filteredCandidates = useMemo(() => {
    let result = candidates.filter((candidate) => {
      const name = (candidate.candidateName || candidate.name || "").toLowerCase()
      const email = (candidate.email || "").toLowerCase()
      const candidateStatus = candidate.candidateStatus || "Screening"
      const candidateJob = candidate.roleTitle || "Unknown Job"

      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === "All" || candidateStatus === statusFilter

      const matchesJob = jobFilter === "All" || candidateJob === jobFilter

      return matchesSearch && matchesStatus && matchesJob
    })

    if (sortBy === "Score High") {
      result = [...result].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    }

    if (sortBy === "Score Low") {
      result = [...result].sort((a, b) => Number(a.score || 0) - Number(b.score || 0))
    }

    return result
  }, [candidates, search, statusFilter, jobFilter, sortBy])

  const total = candidates.length
  const contacted = candidates.filter((c) => c.candidateStatus === "Contacted").length
  const interviews = candidates.filter((c) => c.candidateStatus === "Interview").length
  const offers = candidates.filter((c) => c.candidateStatus === "Offer").length
  const rejected = candidates.filter((c) => c.candidateStatus === "Rejected").length

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 space-y-6 px-8 py-7">
          <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-[34px] font-bold tracking-tight text-slate-950">
                Candidate Pipeline
              </h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">
                Track candidates across every hiring stage, monitor communication status and keep your recruitment workflow moving.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                <option value="All">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.title}>
                    {job.title}
                  </option>
                ))}
              </select>

              <div className="relative">
  <button
    onClick={() => setShowNotifications(!showNotifications)}
    className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-violet-50 hover:text-violet-700"
  >
    <Bell size={19} />
    {activity.length > 0 && (
      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
    )}
  </button>

  {showNotifications && (
    <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="font-bold text-slate-950">
          Pipeline notifications
        </p>
      </div>

      {activity.length ? (
        <div className="max-h-80 overflow-y-auto p-2">
          {activity.map((item, index) => (
            <div
              key={index}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-violet-50"
            >
              {item}
              <p className="mt-1 text-xs text-slate-400">
                Just now
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 text-sm font-medium text-slate-500">
          No pipeline notifications yet.
        </div>
      )}
    </div>
  )}
</div>
            </div>
          </header>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={<Users />} label="Total Candidates" value={total} color="violet" sub="Across current analysis" />
            <MetricCard icon={<Mail />} label="Contacted" value={contacted} color="blue" sub={`${percentage(contacted, total)}% of total`} />
            <MetricCard icon={<Calendar />} label="Interviews" value={interviews} color="indigo" sub={`${percentage(interviews, total)}% of total`} />
            <MetricCard icon={<CheckCircle2 />} label="Offers" value={offers} color="emerald" sub={`${percentage(offers, total)}% of total`} />
            <MetricCard icon={<XCircle />} label="Rejected" value={rejected} color="red" sub={`${percentage(rejected, total)}% of total`} />
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option>All</option>
                  {columns.map((column) => (
                    <option key={column.title}>{column.title}</option>
                  ))}
                </select>

                <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                  <option>Recruiter: All</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search candidates..."
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-80"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option>Last Updated</option>
                  <option>Score High</option>
                  <option>Score Low</option>
                </select>

                
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-4">
            {columns.map((column) => {
              const columnCandidates = filteredCandidates.filter(
                (candidate) =>
                  (candidate.candidateStatus || "Screening") === column.title
              )

              return (
                <div
                  key={column.title}
                  className={`overflow-hidden rounded-[28px] border ${column.accent} bg-white shadow-sm`}
                >
                  <div className={`border-b px-4 py-4 ${column.soft}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                        <h2 className="font-bold tracking-tight text-slate-950">
                          {column.title}
                        </h2>
                      </div>

                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm">
                        {columnCandidates.length}
                      </span>
                    </div>
                  </div>

                  <div className="min-h-[380px] space-y-3 bg-slate-50/50 p-3">
                    {columnCandidates.length ? (
                      columnCandidates.slice(0, 4).map((candidate) => (
                        <CandidateCard
                          key={`${candidate.candidateId}-${candidate.candidateStatus}`}
                          candidate={candidate}
                          onMove={moveCandidate}
                          onReplied={markReplied}
                        />
                      ))
                    ) : (
                      <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm font-medium text-slate-400">
                        No candidates
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Recent Activity
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Latest candidate movements and replies.
                </p>
              </div>

              <button
                onClick={() => {
                  setActivity([])
                  localStorage.removeItem("aptivhire-activity")
                }}
                className="text-sm font-semibold text-violet-700 hover:text-violet-900"
              >
                Clear activity
              </button>
            </div>

            {activity.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {activity.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700"
                  >
                    {item}
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      Just now
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-500">
                No activity yet. Move a candidate or mark a reply to begin.
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  )
}

function CandidateCard({
  candidate,
  onMove,
  onReplied,
}: {
  candidate: Candidate
  onMove: (candidate: Candidate, status: CandidateStatus) => void
  onReplied: (candidate: Candidate) => void
}) {
  const name = candidate.candidateName || candidate.name || "Unknown Candidate"
  const score = Number(candidate.score || 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-300 text-sm font-bold text-white shadow-sm">
            {getInitials(name)}
          </div>

          <div>
            <Link
              href={`/candidates/${candidate.candidateId}`}
              className="font-bold text-slate-950 hover:text-violet-700"
            >
              {name}
            </Link>
            <p className="text-xs font-medium text-slate-500">
              {candidate.roleTitle || "Candidate"}
            </p>
          </div>
        </div>

        <span
          className={`text-sm font-bold ${
            score >= 80
              ? "text-emerald-600"
              : score >= 50
                ? "text-amber-600"
                : "text-red-600"
          }`}
        >
          {score}%
        </span>
      </div>

      <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Calendar size={15} />
        {candidate.communicationStatus || "No email sent"}
      </p>

      {candidate.lastUpdated && (
        <p className="mt-1 text-xs font-medium text-slate-400">
          {candidate.lastUpdated}
        </p>
      )}

      <div className="mt-4 grid gap-2">
        <Link
          href={`/candidates/${candidate.candidateId}?from=pipeline&stage=${encodeURIComponent(
  candidate.candidateStatus || "Screening"
)}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
        >
          View Full Profile
          <ArrowRight size={15} />
        </Link>

        <select
          value={candidate.candidateStatus || "Screening"}
          onChange={(e) =>
            onMove(candidate, e.target.value as CandidateStatus)
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        >
          {columns.map((column) => (
            <option key={column.title}>{column.title}</option>
          ))}
        </select>

        {(candidate.candidateStatus || "Screening") === "Screening" ? (
          <button className="h-10 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700">
            Invite to Interview
          </button>
        ) : (
          <button
            onClick={() => onReplied(candidate)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Mark replied
          </button>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  color: "violet" | "blue" | "indigo" | "emerald" | "red"
}) {
  const colors = {
    violet: "bg-violet-100 text-violet-600",
    blue: "bg-blue-100 text-blue-600",
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    red: "bg-red-100 text-red-600",
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors[color]}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="font-bold text-slate-950">{label}</p>
          <p className="text-sm font-medium text-slate-500">{sub}</p>
        </div>
      </div>
    </div>
  )
}

function percentage(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getCandidateId(candidate: Candidate) {
  return String(candidate.candidateId || "")
}