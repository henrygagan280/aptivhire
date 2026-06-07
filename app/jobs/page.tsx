"use client"
import { createClient } from "@/lib/supabase/browser"

import { Sidebar } from "@/components/sidebar"
import { canCreateJob } from "@/lib/subscription/check-limits";

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentPlan } from "@/lib/subscription/get-current-plan"
import { useEffect, useState } from "react"
import {
  Briefcase,
  Plus,
  Trash2,
  MapPin,
  Building2,
  UploadCloud,
  PlugZap,
  Sparkles,
  Database,
} from "lucide-react"

type SavedJob = {
  id: string
  title: string
  company: string
  location: string
  description: string
  source: "manual" | "indeed" | "totaljobs"
  createdAt: string
}

type JobIntegration = {
  provider: "indeed" | "totaljobs"
  connected: boolean
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<SavedJob[]>([])
  const [integrations, setIntegrations] = useState<JobIntegration[]>([])
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const supabase = createClient()
  const [teamId, setTeamId] = useState<string | null>(null)
  const [limitMessage, setLimitMessage] = useState("");
  
  useEffect(() => {
    
    const savedIntegrations = localStorage.getItem("aptivhire-job-integrations")

    
    if (savedIntegrations) setIntegrations(JSON.parse(savedIntegrations))
  }, [])

  

  const loadJobs = async () => {
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

  if (!jobsData) return

  setJobs(
    jobsData.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company ?? "",
      location: job.location ?? "",
      description: job.description ?? "",
      source: "manual",
      createdAt: job.created_at,
    }))
  )
}

useEffect(() => {
  loadJobs()
}, [])


  const addJob = async () => {
if (!title.trim() || !description.trim()) {
  alert("Please enter a title and description.")
  return
}

if (!teamId) {
  alert("Team ID not loaded.")
  console.log("teamId =", teamId)
  return
}

console.log("teamId =", teamId)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

const userPlan = await getCurrentPlan(supabase, user.id)

const currentActiveJobs = jobs.length;

if (!canCreateJob(userPlan, currentActiveJobs)) {
  setLimitMessage(
  "You've reached the active jobs limit for your current plan. Upgrade to continue creating jobs."
);
  return;
}

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      team_id: teamId,
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      description: description.trim(),
      source: "manual",
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create job:", error)
    alert("Could not save job. Check the console for details.")
    return
  }

  if (data) {
    setJobs([
      {
        id: data.id,
        title: data.title,
        company: data.company ?? "",
        location: data.location ?? "",
        description: data.description ?? "",
        source: "manual",
        createdAt: data.created_at,
      },
      ...jobs,
    ])
  }

  setTitle("")
  setCompany("")
  setLocation("")
  setDescription("")
}

  const deleteJob = async (id: string) => {
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Failed to delete job:", error)
    alert("Could not delete job. Check the console for details.")
    return
  }

  setJobs(jobs.filter((job) => job.id !== id))
}

  const connectedProviders = integrations.filter((item) => item.connected)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 space-y-6 px-8 py-7">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
                Job Library
              </p>

              <h1 className="mt-2 text-[34px] font-bold tracking-tight text-slate-950">
                Jobs
              </h1>

              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">
                Save roles once, reuse them during candidate analysis, and keep every hiring pipeline organised by role.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              <StatCard
                icon={<Briefcase size={20} />}
                value={jobs.length}
                label="Saved jobs"
              />

              
            </div>
          </header>

          <section className="rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-slate-50 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
                <PlugZap size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Connected job boards
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {connectedProviders.length > 0
                    ? `Jobs from ${connectedProviders
                        .map((provider) =>
                          provider.provider === "indeed" ? "Indeed" : "Totaljobs"
                        )
                        .join(", ")} will appear in this job library.`
                    : "Indeed and Totaljobs integrations will appear here once connected."}
                </p>
              </div>
            </div>
          </section>

          {limitMessage && (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-amber-900">
          Subscription Limit Reached
        </p>

        <p className="text-sm text-amber-700">
          {limitMessage}
        </p>
      </div>

      <button
  onClick={() => window.location.href = "/subscription"}
  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
>
  Upgrade
</button>
    </div>
  </div>
)}

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-white via-violet-50/50 to-white px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Plus size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    Create a job manually
                  </h2>

                  <p className="text-sm font-medium text-slate-500">
                    Paste a job description to make it available on the Analyse Candidates page.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Job title"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />

                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />

                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={8}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />

              <div className="flex justify-end">
                <button
                  onClick={addJob}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
                >
                  <Plus size={18} />
                  Save Job
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:grid-cols-1">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Saved Jobs
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  These jobs will appear in the saved job dropdown when analysing candidates.
                </p>
              </div>
            </div>

            {jobs.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                          {job.source === "manual"
                            ? "Manual"
                            : job.source === "indeed"
                              ? "Indeed"
                              : "Totaljobs"}
                        </div>

                        <h3 className="text-lg font-bold tracking-tight text-slate-950">
                          {job.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                          {job.company && (
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 size={15} />
                              {job.company}
                            </span>
                          )}

                          {job.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={15} />
                              {job.location}
                            </span>
                          )}
                        </div>

                        <p className="mt-4 line-clamp-4 text-sm font-medium leading-6 text-slate-500">
                          {job.description}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteJob(job.id)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <UploadCloud />
                </div>

                <h3 className="font-bold text-slate-950">
                  No jobs saved yet
                </h3>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  Add a job manually or connect a job board in Settings.
                </p>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
        {icon}
      </div>

      <p className="text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-500">
        {label}
      </p>
    </div>
  )
}