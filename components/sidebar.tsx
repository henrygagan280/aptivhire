"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/browser"
import { PLAN_LIMITS } from "@/lib/subscription/plans"
import { getCurrentPlan } from "@/lib/subscription/get-current-plan"
import type { PlanId } from "@/lib/subscription/plans"
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Mail,
  Settings,
  Sparkles,
  Users,
  Calendar,
} from "lucide-react"



export function Sidebar() {
  const [jobs, setJobs] = useState(0)
  const [emails, setEmails] = useState(0)
  const [activeCandidates, setActiveCandidates] = useState(0)
  const [analysed, setAnalysed] = useState(0)
  const [showAssistant, setShowAssistant] = useState(true)
  const [userName, setUserName] = useState("User")
const [userInitials, setUserInitials] = useState("U")
const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null)
const limits = currentPlan ? PLAN_LIMITS[currentPlan] : null

  const pathname = usePathname()

const isActive = (href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

useEffect(() => {
  const supabase = createClient()

  const loadSidebarData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const plan = await getCurrentPlan(supabase, user.id)
setCurrentPlan(plan)

    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User"

    setUserName(name)

    setUserInitials(
      name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    )

    

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership?.team_id) return

    const teamId = membership.team_id

    const [jobsRes, emailsRes, candidatesRes, pipelineRes] =
      await Promise.all([
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("team_id", teamId),

        supabase
          .from("email_threads")
          .select("id", { count: "exact", head: true })
          .eq("team_id", teamId),

        supabase
  .from("subscription_usage")
  .select("analyses_used")
  .eq("team_id", teamId)
  .eq("month", new Date().toISOString().slice(0, 7))
  .maybeSingle(),

        supabase
          .from("pipeline")
          .select("id", { count: "exact", head: true })
          .eq("team_id", teamId),
      ])

    setJobs(jobsRes.count || 0)
    setEmails(emailsRes.count || 0)
    
    setAnalysed(candidatesRes.data?.analyses_used || 0)
    setActiveCandidates(pipelineRes.count || 0)
  }

  loadSidebarData()

  window.addEventListener("usage-updated", loadSidebarData)

  return () => {
    window.removeEventListener("usage-updated", loadSidebarData)
  }
}, [])



  const [showProfileMenu, setShowProfileMenu] = useState(false)
const profileMenuRef = useRef<HTMLDivElement | null>(null)

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      profileMenuRef.current &&
      !profileMenuRef.current.contains(event.target as Node)
    ) {
      setShowProfileMenu(false)
    }
  }

  document.addEventListener("mousedown", handleClickOutside)

  return () => {
    document.removeEventListener("mousedown", handleClickOutside)
  }
}, [])

  const handleLogout = async () => {
  const supabase = createClient()

  await supabase.auth.signOut()

  window.location.href = "/login"
}

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col bg-[#070D1C] pt-2 text-white">
      <div className="flex h-[92px] items-center px-6 pt-1">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-300 via-violet-500 to-purple-700 shadow-[0_0_30px_rgba(139,92,246,0.55)]" />

          <span className="text-[22px] font-bold tracking-[-0.03em] text-white">
            Nuviq
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-2">
        <SidebarLink
  href="/dashboard"
  active={isActive("/dashboard")}
  icon={<BarChart3 />}
  label="Dashboard"
/>

        <SidebarGroup title="Hiring">
          <SidebarLink
  href="/analyse-candidates"
  active={isActive("/analyse-candidates")}
  icon={<Sparkles />}
  label="Analyse Candidates"
/>

          <SidebarLink
  href="/pipeline"
  active={isActive("/pipeline")}
  icon={<Users />}
  label="Candidate Pipeline"
  badge={activeCandidates || 0}
/>

          <SidebarLink
  href="/jobs"
  active={isActive("/jobs")}
  icon={<Briefcase />}
  label="Jobs"
  badge={jobs || 0}
/>
        </SidebarGroup>

        <SidebarGroup title="Communication">
          <SidebarLink
  href="/emails"
  active={isActive("/emails")}
  icon={<Mail />}
  label="Inbox"
  badge={emails || 0}
/>

<SidebarLink
  href="/interviews"
  active={isActive("/interviews")}
  icon={<Calendar />}
  label="Interviews"
/>
        </SidebarGroup>

        <SidebarGroup title="Account">
          <SidebarLink
  href="/settings"
  active={isActive("/settings")}
  icon={<Settings />}
  label="Settings"
/>
        </SidebarGroup>

        <button
          onClick={() => setShowAssistant(!showAssistant)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-xl transition hover:bg-white/10"
        >
          
        </button>
      </nav>

      <div ref={profileMenuRef} className="border-t border-white/10 p-4">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-white/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-400 font-black">
            {userInitials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-black">{userName}</p>
            <p className="text-sm text-slate-300">Recruiter</p>
          </div>

          <ChevronDown
            size={16}
            className={`transition ${
              showProfileMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {showProfileMenu && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
            <Link
              href="/settings"
              className="block rounded-xl px-3 py-2 font-bold hover:bg-white/10"
            >
              Account Settings
            </Link>

            <Link
              href="/emails"
              className="block rounded-xl px-3 py-2 font-bold hover:bg-white/10"
            >
              Email Centre
            </Link>

            <button
  onClick={handleLogout}
  className="block w-full rounded-xl px-3 py-2 text-left font-bold text-red-300 hover:bg-white/10"
>
  Log out
</button>
          </div>
        )}

        <Link
          href="/settings"
          className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="font-black">
  {userName.split(" ")[0]}'s Workspace
</p>

            <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-bold">
  {limits ? `${limits.name} Plan` : "No Plan"}
</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-lg font-black">
  {limits?.activeJobs === null ? `${jobs} / Unlimited` : `${jobs} / ${limits?.activeJobs ?? 0}`}
</p>
              <p className="text-slate-300">Active jobs</p>
            </div>

            <div>
              <p className="text-lg font-black">
  {limits?.candidateAnalysesPerMonth === null
    ? `${analysed} / Unlimited`
    : `${analysed} / ${limits?.candidateAnalysesPerMonth ?? 0}`}
</p>
              <p className="text-slate-300">Analysed</p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
  <div
    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-400"
    style={{
      width:
        limits?.activeJobs === null ||
        limits?.candidateAnalysesPerMonth === null
          ? "100%"
          : `${Math.max(
              limits?.activeJobs
                ? Math.min(100, (jobs / limits.activeJobs) * 100)
                : 0,
              limits?.candidateAnalysesPerMonth
                ? Math.min(
                    100,
                    (analysed / limits.candidateAnalysesPerMonth) * 100
                  )
                : 0
            )}%`,
    }}
  />
</div>
        </Link>
      </div>
    </aside>
  )
}

function SidebarGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-3 px-3 text-xs font-black uppercase tracking-widest text-slate-400">
        {title}
      </p>

      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function SidebarLink({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-[0_10px_40px_rgba(124,58,237,0.45)]"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={
            active
              ? "text-white"
              : "text-slate-400 group-hover:text-white"
          }
        >
          {icon}
        </span>

        {label}
      </span>

      {typeof badge === "number" && badge > 0 && (
        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-black text-white">
          {badge}
        </span>
      )}
    </Link>
  )
}

function AssistantRow({
  dot,
  text,
  sub,
}: {
  dot: string
  text: string
  sub: string
}) {
  return (
    <div className="flex gap-3">
      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dot}`} />

      <div>
        <p className="font-bold text-white">
          {text}
        </p>

        <p className="text-xs text-slate-300">
          {sub}
        </p>
      </div>
    </div>
  )
}