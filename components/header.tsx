"use client"

import { logout } from "@/app/auth/actions";
import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, ChevronDown, Settings, LogOut, Mail, User, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/browser"

type HeaderProps = {
  searchTerm?: string
  setSearchTerm?: (value: string) => void
  results?: any[]
}

type GlobalSearchItem = {
  id: string
  type: "page" | "candidate" | "job" | "interview" | "email"
  title: string
  subtitle: string
  href: string
}

export function Header({
  searchTerm = "",
  setSearchTerm,
  results = [],
}: HeaderProps) {
  

  const [showNotifications, setShowNotifications] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [notifications, setNotifications] = useState<string[]>([])
  const [profileName, setProfileName] = useState("User")
const [profileRole, setProfileRole] = useState("Recruiter")
const [localSearch, setLocalSearch] = useState("")
  const activeSearch = setSearchTerm ? searchTerm : localSearch
  const [globalResults, setGlobalResults] = useState<GlobalSearchItem[]>([])



  useEffect(() => {
    const activity = JSON.parse(
      localStorage.getItem("aptivhire-activity") || "[]"
    )

    const emails = JSON.parse(
      localStorage.getItem("aptivhire-email-threads") || "[]"
    )

    const emailNotifications = emails
      .filter((email: any) => email.status === "Replied")
      .map((email: any) => `${email.candidateName} replied to your email`)

    setNotifications([...emailNotifications, ...activity].slice(0, 5))
  }, [])

useEffect(() => {
  const loadProfile = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single()

    setProfileName(profile?.full_name || user.email || "User")
    setProfileRole(profile?.role || "Recruiter")
  }

  loadProfile()
}, [])



useEffect(() => {
  const search = async () => {
    const term = activeSearch.trim()

    if (!term) {
      setGlobalResults([])
      return
    }

    const pages = [
      { id: "dashboard", type: "page", title: "Dashboard", subtitle: "Recruitment analytics", href: "/dashboard" },
      { id: "analyse", type: "page", title: "Analyse Candidates", subtitle: "Upload and rank CVs", href: "/analyse-candidates" },
      { id: "pipeline", type: "page", title: "Candidate Pipeline", subtitle: "Manage candidate stages", href: "/pipeline" },
      { id: "jobs", type: "page", title: "Jobs", subtitle: "Create and manage jobs", href: "/jobs" },
      { id: "emails", type: "page", title: "Inbox", subtitle: "Candidate emails", href: "/emails" },
      { id: "interviews", type: "page", title: "Interviews", subtitle: "Booked interviews", href: "/interviews" },
      { id: "settings", type: "page", title: "Settings", subtitle: "Account settings", href: "/settings" },
    ] satisfies GlobalSearchItem[]

    const filteredPages = pages.filter((page) =>
      `${page.title} ${page.subtitle}`.toLowerCase().includes(term.toLowerCase())
    )

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setGlobalResults(filteredPages)
      return
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership?.team_id) {
      setGlobalResults(filteredPages)
      return
    }

    const { data: candidates } = await supabase
      .from("candidates")
      .select("id, name, email, job_title, role_title, score")
      .eq("team_id", membership.team_id)
      .or(
        `name.ilike.%${term}%,email.ilike.%${term}%,job_title.ilike.%${term}%,role_title.ilike.%${term}%`
      )
      .limit(8)

    const candidateResults: GlobalSearchItem[] =
      candidates?.map((candidate) => ({
        id: candidate.id,
        type: "candidate",
        title: candidate.name || "Unnamed candidate",
        subtitle: `${candidate.role_title || candidate.job_title || "Candidate"} · ${candidate.email || "No email"} · ${candidate.score || 0}%`,
        href: `/candidates/${candidate.id}`,
      })) || []

    setGlobalResults([...filteredPages, ...candidateResults].slice(0, 10))
  }

  const timeout = setTimeout(search, 250)
  return () => clearTimeout(timeout)
}, [activeSearch])


  return (
     <header className="relative flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

  <div className="relative mx-auto w-full max-w-xl">
    <Search
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
    />

    <input
  value={activeSearch}
  onChange={(e) => {
    if (setSearchTerm) {
      setSearchTerm(e.target.value)
    } else {
      setLocalSearch(e.target.value)
    }
  }}
  placeholder="Search candidates, jobs, or anything..."
  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-14 text-sm font-semibold shadow-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
/>

    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
      ⌘ K
    </span>

{activeSearch.trim() && (
  <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
    {globalResults.length ? (
      <div className="max-h-96 overflow-y-auto p-2">
        {globalResults.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.href}
            onClick={() => {
              setLocalSearch("")
              setSearchTerm?.("")
            }}
            className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:bg-violet-50"
          >
            <div>
              <p className="text-sm font-bold text-slate-950">{item.title}</p>
              <p className="text-xs font-medium text-slate-500">
                {item.type.toUpperCase()} · {item.subtitle}
              </p>
            </div>

            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
              Open
            </span>
          </Link>
        ))}
      </div>
    ) : (
      <div className="p-5 text-center text-sm font-medium text-slate-500">
        No results found.
      </div>
    )}
  </div>
)}

  </div>
  

  <div className="ml-8 flex items-center gap-5">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowAccount(false)
            }}
            className="relative rounded-xl p-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <Bell size={22} />

            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="font-bold text-slate-950">Notifications</p>
              </div>

              {notifications.length ? (
                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-violet-50"
                    >
                      {item}
                      <p className="mt-1 text-xs text-slate-400">Just now</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-sm font-medium text-slate-500">
                  No notifications yet.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowAccount(!showAccount)
              setShowNotifications(false)
            }}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-violet-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-400 font-bold text-white">
  {profileName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()}
</div>

            <div className="text-left">
              <p className="font-bold text-slate-950">{profileName}</p>
              <p className="text-sm font-medium text-slate-500">{profileRole}</p>
            </div>

            <ChevronDown size={16} className="text-slate-500" />
          </button>

          {showAccount && (
            <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              >
                <Settings size={16} />
                Account Settings
              </Link>

              <Link
                href="/emails"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              >
                <Mail size={16} />
                Email Centre
              </Link>

              <form action={logout}>
  <button
    type="submit"
    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
  >
    <LogOut size={16} />
    Log out
  </button>
</form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}