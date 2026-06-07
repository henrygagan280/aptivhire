"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CalendarDays,
  Crown,
  Mail,
  RefreshCw,
  Star,
  Target,
  Users,
  Zap,
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/browser"

type Job = {
  id: string
  title: string
  company?: string | null
  created_at?: string
}

type Candidate = {
  id: string
  team_id?: string
  name?: string | null
  candidate_key?: string | null
  email?: string | null
  job_id?: string | null
  job_title?: string | null
  role_title?: string | null
  score?: number | null
  recommendation?: string | null
  matched_skills?: string[] | null
  created_at?: string
}

type PipelineRow = {
  id: string
  candidate_id?: string | null
  candidate_name?: string | null
  candidate_email?: string | null
  job_id?: string | null
  job_title?: string | null
  stage?: string | null
  candidate_status?: string | null
  status?: string | null
  created_at?: string
}

type EmailThread = {
  id: string
  candidate_name?: string | null
  candidate_email?: string | null
  job_title?: string | null
  status?: string | null
  sent_at?: string | null
  replied_at?: string | null
  booked_slot?: string | null
  updated_at?: string | null
}

type Interview = {
  id: string
  candidate_name?: string | null
  candidate_email?: string | null
  job_title?: string | null
  slot?: string | null
  location?: string | null
  meeting_link?: string | null
  created_at?: string
}

const minutesPerCandidate = 20
const minutesPerEmail = 5
const minutesPerInterview = 15
const workDayMinutes = 8 * 60

function toNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getStage(row: PipelineRow) {
  return row.stage || row.candidate_status || row.status || "Screening"
}

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours <= 0) return `${minutes}m`
  if (minutes <= 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export default function DashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState("all")
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [pipeline, setPipeline] = useState<PipelineRow[]>([])
  const [emails, setEmails] = useState<EmailThread[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])

  async function loadDashboard() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single()

    if (!membership?.team_id) {
      setLoading(false)
      return
    }

    const teamId = membership.team_id

    const [jobsRes, candidatesRes, pipelineRes, emailsRes, interviewsRes] =
      await Promise.all([
        supabase.from("jobs").select("*").eq("team_id", teamId),
        supabase.from("candidates").select("*").eq("team_id", teamId),
        supabase.from("pipeline").select("*").eq("team_id", teamId),
        supabase.from("email_threads").select("*").eq("team_id", teamId),
        supabase.from("interviews").select("*").eq("team_id", teamId),
      ])

    setJobs((jobsRes.data || []) as Job[])
    setCandidates((candidatesRes.data || []) as Candidate[])
    setPipeline((pipelineRes.data || []) as PipelineRow[])
    setEmails((emailsRes.data || []) as EmailThread[])
    setInterviews((interviewsRes.data || []) as Interview[])
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scoped = useMemo(() => {
    if (selectedJobId === "all") {
      return { candidates, pipeline, emails, interviews }
    }

    const selectedJob = jobs.find((job) => job.id === selectedJobId)
    const jobTitle = selectedJob?.title || ""

    return {
      candidates: candidates.filter(
        (candidate) =>
          candidate.job_id === selectedJobId ||
          candidate.job_title === jobTitle ||
          candidate.role_title === jobTitle
      ),
      pipeline: pipeline.filter(
        (row) => row.job_id === selectedJobId || row.job_title === jobTitle
      ),
      emails: emails.filter((thread) => thread.job_title === jobTitle),
      interviews: interviews.filter((interview) => interview.job_title === jobTitle),
    }
  }, [selectedJobId, jobs, candidates, pipeline, emails, interviews])

  const stats = useMemo(() => {
    const now = new Date()
    const futureInterviews = scoped.interviews
      .filter((interview) => {
        const date = parseDate(interview.slot)
        return date ? date >= now : false
      })
      .sort((a, b) =>
        (parseDate(a.slot)?.getTime() || 0) - (parseDate(b.slot)?.getTime() || 0)
      )

    const scores = scoped.candidates.map((c) => toNumber(c.score))
    const avgScore = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0

    const strong = scoped.candidates.filter((c) => toNumber(c.score) >= 80).length
    const good = scoped.candidates.filter((c) => {
      const score = toNumber(c.score)
      return score >= 50 && score < 80
    }).length
    const weak = scoped.candidates.filter((c) => toNumber(c.score) < 50).length

    const screening = scoped.pipeline.filter((row) => getStage(row) === "Screening").length
    const contacted = scoped.pipeline.filter((row) => getStage(row) === "Contacted").length
    const interview = scoped.pipeline.filter((row) => getStage(row) === "Interview").length
    const offer = scoped.pipeline.filter((row) => getStage(row) === "Offer").length
    const rejected = scoped.pipeline.filter((row) => getStage(row) === "Rejected").length

    const replies = scoped.emails.filter((thread) => !!thread.replied_at || thread.status === "Replied").length
    const bookedEmails = scoped.emails.filter((thread) => thread.status === "Booked").length
    const pendingEmails = scoped.emails.filter(
      (thread) => thread.status === "Invite sent" || thread.status === "Rejection sent"
    ).length

    const cvMinutes = scoped.candidates.length * minutesPerCandidate
    const emailMinutes = scoped.emails.length * minutesPerEmail
    const interviewMinutes = scoped.interviews.length * minutesPerInterview
    const totalMinutes = cvMinutes + emailMinutes + interviewMinutes

    const topCandidate = [...scoped.candidates].sort(
      (a, b) => toNumber(b.score) - toNumber(a.score)
    )[0]

    return {
      futureInterviews,
      avgScore,
      strong,
      good,
      weak,
      screening,
      contacted,
      interview,
      offer,
      rejected,
      replies,
      bookedEmails,
      pendingEmails,
      cvMinutes,
      emailMinutes,
      interviewMinutes,
      totalMinutes,
      workDaysSaved: totalMinutes / workDayMinutes,
      topCandidate,
    }
  }, [scoped])

  const selectedJobLabel =
    selectedJobId === "all"
      ? "All jobs"
      : jobs.find((job) => job.id === selectedJobId)?.title || "Selected job"

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-950">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 px-8 py-7">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-[34px] font-black tracking-tight text-slate-950">
                Welcome back, Henry! 👋
              </h1>
              <p className="mt-2 text-base font-semibold text-slate-600">
                Here&apos;s what&apos;s happening with your recruitment pipeline today.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 shadow-sm">
                <CalendarDays className="h-4 w-4" />
                Live account data
              </div>

              <select
                value={selectedJobId}
                onChange={(event) => setSelectedJobId(event.target.value)}
                className="h-12 min-w-[240px] rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-950 shadow-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                <option value="all">All jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>

              <button
                onClick={loadDashboard}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <section className="mb-6 grid gap-4 xl:grid-cols-6">
            <KpiCard href="/analyse-candidates" icon={<Users />} label="Candidates saved" value={scoped.candidates.length} sub={`${stats.strong} strong matches`} tone="violet" />
            <KpiCard href="/pipeline" icon={<Target />} label="Active pipeline" value={scoped.pipeline.length} sub={`${stats.interview} in interview stage`} tone="orange" />
            <KpiCard href="/interviews" icon={<CalendarDays />} label="Upcoming interviews" value={stats.futureInterviews.length} sub={`${scoped.interviews.length} total booked`} tone="blue" />
            <KpiCard href="/emails" icon={<Mail />} label="Email threads" value={scoped.emails.length} sub={`${stats.replies} replies · ${stats.pendingEmails} pending`} tone="green" />
            <KpiCard href="/analyse-candidates" icon={<Star />} label="Avg. candidate score" value={stats.avgScore} sub="Live score average" tone="violet" />
            <KpiCard href="/jobs" icon={<Briefcase />} label="Active jobs" value={jobs.length} sub={selectedJobLabel} tone="orange" />
          </section>

          <section className="mb-6 grid gap-5 xl:grid-cols-[0.9fr_1fr_1.1fr]">
  <Panel className="h-full">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h2 className="text-lg font-black text-slate-950">Time saved this week</h2>
      <p className="mt-1 text-sm font-bold text-slate-500">
        Saved CV review, email admin and interview scheduling time.
      </p>
    </div>
    <Zap className="h-6 w-6 shrink-0 text-orange-500" />
  </div>

  <div className="mt-6 flex items-center justify-between gap-5">
    <div>
      <p className="text-4xl font-extrabold tracking-tight text-slate-900">
        {formatMinutes(stats.totalMinutes)}
      </p>
      <p className="mt-1 text-sm font-black text-slate-500">
        Total estimated time saved
      </p>
      <p className="mt-3 inline-flex rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-violet-50 px-3 py-1 text-xs font-black text-emerald-700">
        ≈ {stats.workDaysSaved.toFixed(1)} work days saved
      </p>
    </div>

    <AnimatedRing
      percent={Math.min(100, Math.round(stats.workDaysSaved * 100))}
      label={`${stats.workDaysSaved.toFixed(1)}`}
      sub="DAYS"
      size={90}
      stroke={10}
      color="#7c3aed"
    />
  </div>

  <div className="mt-6 grid grid-cols-3 gap-3">
  <MiniBreakdown
    label="CV"
    value={formatMinutes(stats.cvMinutes)}
    sub={`${scoped.candidates.length}`}
  />

  <MiniBreakdown
    label="Emails"
    value={formatMinutes(stats.emailMinutes)}
    sub={`${scoped.emails.length}`}
  />

  <MiniBreakdown
    label="Interviews"
    value={formatMinutes(stats.interviewMinutes)}
    sub={`${scoped.interviews.length}`}
  />
</div>
</Panel>

            <Panel className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Pipeline overview</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">Current candidate stage distribution.</p>
                </div>
                <BarChart3 className="h-6 w-6 text-violet-600" />
              </div>

              <div className="mt-6 space-y-3">
                <FunnelRow label="Screening" value={stats.screening} max={Math.max(scoped.pipeline.length, 1)} tone="violet" />
                <FunnelRow label="Contacted" value={stats.contacted} max={Math.max(scoped.pipeline.length, 1)} tone="blue" />
                <FunnelRow label="Interview" value={stats.interview} max={Math.max(scoped.pipeline.length, 1)} tone="orange" />
                <FunnelRow label="Offer" value={stats.offer} max={Math.max(scoped.pipeline.length, 1)} tone="green" />
                <FunnelRow label="Rejected" value={stats.rejected} max={Math.max(scoped.pipeline.length, 1)} tone="slate" />
              </div>

              <Link href="/pipeline" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-violet-700 hover:text-violet-900">
                View full pipeline <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Panel>

            <Panel className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Candidate quality score</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">Score health for {selectedJobLabel}.</p>
                </div>
                <Star className="h-6 w-6 text-orange-500" />
              </div>

              <div className="mt-7 grid grid-cols-[170px_1fr] items-center gap-6">
                <AnimatedRing percent={Math.min(100, Math.max(0, stats.avgScore))} label={`${stats.avgScore}`} sub="AVG SCORE" size={170} stroke={18} color="#ff6b00" secondColor="#7c3aed" />

                <div className="space-y-4">
                  <LegendRow color="bg-violet-600" label="Strong (80-100)" value={stats.strong} total={scoped.candidates.length} />
                  <LegendRow color="bg-orange-500" label="Good (50-79)" value={stats.good} total={scoped.candidates.length} />
                  <LegendRow color="bg-slate-400" label="Review (0-49)" value={stats.weak} total={scoped.candidates.length} />
                </div>
              </div>

              <Link href="/analyse-candidates" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-violet-700 hover:text-violet-900">
                Analyse more candidates <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Panel>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <Panel>
              <h2 className="text-lg font-black text-slate-950">Upcoming interviews</h2>
              <div className="mt-5 space-y-3">
                {stats.futureInterviews.slice(0, 2).length ? (
                  stats.futureInterviews.slice(0, 2).map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} />
                  ))
                ) : (
                  <EmptyCard text="No upcoming interviews booked." />
                )}
              </div>
              <Link href="/interviews" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-violet-700 hover:text-violet-900">
                View all interviews <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Panel>

            <Panel>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                <Crown className="h-5 w-5 text-orange-500" />
                Top candidate <span className="font-bold text-slate-500">({selectedJobLabel})</span>
              </h2>

              {stats.topCandidate ? (
                <Link href={`/candidates/${stats.topCandidate.id}`} className="mt-5 block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-violet-200 hover:bg-violet-50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-orange-400 text-lg font-black text-white shadow-lg shadow-violet-100">
                        {(stats.topCandidate.name || "C")
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-slate-950">{stats.topCandidate.name || "Unnamed candidate"}</p>
                        <p className="text-sm font-bold text-slate-500">{stats.topCandidate.role_title || stats.topCandidate.job_title || "Candidate"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-slate-950">{toNumber(stats.topCandidate.score)}%</p>
                      <p className="text-xs font-black uppercase text-slate-500">Match score</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(stats.topCandidate.matched_skills || []).slice(0, 4).map((skill) => (
                      <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Link>
              ) : (
                <EmptyCard text="No candidate scores yet." />
              )}
            </Panel>

            <Panel>
              <h2 className="text-lg font-black text-slate-950">Activity feed</h2>
              <div className="mt-5 space-y-3">
                <ActivityRow icon={<Users />} text={`${scoped.candidates.length} candidates saved`} sub="From Supabase candidates" />
                <ActivityRow icon={<Mail />} text={`${scoped.emails.length} email threads tracked`} sub={`${stats.bookedEmails} booked from emails`} />
                <ActivityRow icon={<CalendarDays />} text={`${scoped.interviews.length} interviews booked`} sub={`${stats.futureInterviews.length} upcoming`} />
              </div>
            </Panel>
          </section>
        </main>
      </div>
    </div>
  )
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 ${className}`}>
      {children}
    </div>
  )
}

function KpiCard({ href, icon, label, value, sub, tone }: { href: string; icon: React.ReactNode; label: string; value: number; sub: string; tone: "violet" | "orange" | "blue" | "green" }) {
  const tones = {
    violet: "bg-violet-50 text-violet-700",
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
  }

  const spark = {
    violet: "#7c3aed",
    orange: "#ff6b00",
    blue: "#2563eb",
    green: "#059669",
  }[tone]

  return (
    <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>{icon}</div>
        <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-violet-600" />
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{label}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{sub}</p>
      <svg viewBox="0 0 160 34" className="mt-4 h-8 w-full overflow-visible">
        <path d="M0 24 C18 22, 22 18, 40 20 S68 10, 84 15 S112 8, 132 12 S150 13, 160 8" fill="none" stroke={spark} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </Link>
  )
}

function AnimatedRing({ percent, label, sub, size, stroke, color, secondColor }: { percent: number; label: string; sub: string; size: number; stroke: number; color: string; secondColor?: string }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        {secondColor && (
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={secondColor} strokeWidth={stroke} strokeDasharray={`${circumference * 0.36} ${circumference}`} strokeLinecap="round" opacity="0.95" />
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-xl font-semibold leading-none text-slate-800">{label}</p>
        <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400">{sub}</p>
      </div>
    </div>
  )
}

function MiniBreakdown({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 px-3 py-3 shadow-sm">
      <p className="text-base font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{sub}</p>
    </div>
  )
}

function FunnelRow({ label, value, max, tone }: { label: string; value: number; max: number; tone: "violet" | "blue" | "orange" | "green" | "slate" }) {
  const colors = {
    violet: "bg-violet-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    green: "bg-emerald-500",
    slate: "bg-slate-400",
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm font-black">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-950">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colors[tone]} transition-all duration-1000`} style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
      </div>
    </div>
  )
}

function LegendRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const percent = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center justify-between gap-3 text-sm font-bold">
      <div className="flex items-center gap-2 text-slate-700">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        {label}
      </div>
      <span className="font-black text-slate-950">{value} ({percent}%)</span>
    </div>
  )
}

function InterviewCard({ interview }: { interview: Interview }) {
  const date = parseDate(interview.slot)
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-slate-950">{interview.candidate_name || "Unnamed candidate"}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{interview.job_title || "Interview"}</p>
          <p className="mt-2 text-sm font-black text-violet-700">
            {date
              ? date.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
              : interview.slot || "No date"}
          </p>
        </div>
        {interview.meeting_link && (
          <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white hover:bg-violet-700">
            Join
          </a>
        )}
      </div>
    </div>
  )
}

function ActivityRow({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">{icon}</div>
      <div>
        <p className="text-sm font-black text-slate-950">{text}</p>
        <p className="text-xs font-bold text-slate-500">{sub}</p>
      </div>
    </div>
  )
}

function EmptyCard({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">{text}</div>
}
