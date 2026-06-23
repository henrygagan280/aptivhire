"use client"

import { hasActiveSubscription } from "@/lib/subscription/check-client-subscription"
import TopCandidatesPodium from "@/components/top-candidates-podium"
import { UploadCloud, Star, Download, Send } from "lucide-react"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import StatsCards from "@/components/stats-cards"
import { CandidateTable } from "@/components/candidate-table"
import { ScoreLegend } from "@/components/score-legend"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/browser"
import { checkTeamLimits } from "@/lib/subscription/check-limits"

type SavedJob = {
  id: string
  title: string
  company: string
  location: string
  description: string
  source: "manual" | "indeed" | "totaljobs"
  createdAt: string
}

export default function CandidateRankingsPage() {
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)
  const [jobUrl, setJobUrl] = useState("")
  const [importingJobUrl, setImportingJobUrl] = useState(false)
  const [jobUrlError, setJobUrlError] = useState("")
  const supabase = createClient()

  

  const loadSavedJobs = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    console.error("Could not load team membership:", membershipError)
    return
  }

  const { data: jobsData, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .eq("team_id", membership.team_id)
    .order("created_at", { ascending: false })

  if (jobsError) {
    console.error("Could not load jobs:", jobsError)
    return
  }

  setSavedJobs(
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
}

  useEffect(() => {
  async function initializePage() {
    const allowed = await hasActiveSubscription(supabase)

    if (!allowed) {
      window.location.href = "/subscription"
      return
    }

    const savedResults = localStorage.getItem("aptivhire-results")

    if (savedResults) {
      setResults(JSON.parse(savedResults))
    }

    loadSavedJobs()
  }

  initializePage()
}, [])

  useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem("aptivhire-results", JSON.stringify(results))
    }
  }, [results])

  async function handleImportJobUrl() {
    setJobUrlError("")

    if (!jobUrl.trim()) {
      setJobUrlError("Paste a job URL first.")
      return
    }

    try {
      setImportingJobUrl(true)

      const response = await fetch("/api/import-job-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: jobUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        setJobUrlError(
          data.error ||
            "We couldn't read this job page. Some sites like Indeed, LinkedIn and Workday block automatic imports. Please copy and paste the job description instead."
        )
        return
      }

      if (data.jobTitle) setJobTitle(data.jobTitle)
      if (data.jobDescription) setJobDescription(data.jobDescription)
    } catch {
      setJobUrlError("Could not import this job page.")
    } finally {
      setImportingJobUrl(false)
    }
  }

  function handleSelectSavedJob(jobId: string) {
    setSelectedJobId(jobId)

    const selectedJob = savedJobs.find((job) => job.id === jobId)
    if (!selectedJob) return

    setJobTitle(selectedJob.title)
    setJobDescription(selectedJob.description)
  }

  async function incrementAnalysesUsed(teamId: string, amount: number) {
  const month = new Date().toISOString().slice(0, 7)

  console.log("USAGE FUNCTION CALLED", { teamId, amount, month })

  const { data: existing, error: lookupError } = await supabase
    .from("subscription_usage")
    .select("id, analyses_used")
    .eq("team_id", teamId)
    .eq("month", month)
    .maybeSingle()

  if (lookupError) {
    console.error("Usage lookup error:", lookupError)
    return
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from("subscription_usage")
      .insert({
        team_id: teamId,
        month,
        analyses_used: amount,
        jobs_created: 0,
      })

    if (insertError) {
      console.error("Usage insert error:", insertError)
      return
    }

    console.log("USAGE INSERTED", { teamId, amount, month })

    window.dispatchEvent(new Event("usage-updated"))
    return
  }

  const { error: updateError } = await supabase
    .from("subscription_usage")
    .update({
      analyses_used: existing.analyses_used + amount,
    })
    .eq("id", existing.id)

  if (updateError) {
    console.error("Usage update error:", updateError)
    return
  }

  console.log("USAGE UPDATED", {
    previous: existing.analyses_used,
    added: amount,
    next: existing.analyses_used + amount,
  })

  window.dispatchEvent(new Event("usage-updated"))

  }

  async function handleAnalyse() {

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    setError("You must be logged in to analyse candidates.")
    return
  }

  const { allowed, limits, usage } =
    await checkTeamLimits(supabase, user.id)

  if (!allowed || !usage) {
    setError("Could not check your plan limits.")
    return
  }

  if (
    limits.candidateAnalysesPerMonth !== null &&
    usage.analysed + files.length >
      limits.candidateAnalysesPerMonth
  ) {
    setError(
      "You have reached your monthly candidate analysis limit."
    )
    return
  }

  setLoading(true)
  setCompleted(0)
  setTotal(files.length)

  

    const progressInterval = setInterval(async () => {
      const statusRes = await fetch("/api/analyse-status")
      const status = await statusRes.json()

      setCompleted(status.completed || 0)
      setTotal(status.total || files.length)
    }, 500)

    try {
      const formData = new FormData()
      formData.append("jobTitle", jobTitle)
      formData.append("jobDescription", jobDescription)

      files.forEach((file) => {
        formData.append("files", file)
      })

      const res = await fetch("/api/analyse", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      const analysedCandidates = (data.results || data.candidates || []).map(
  (candidate: any) => {
    const candidateKey =
      candidate.email ||
      candidate.candidateName ||
      candidate.name ||
      candidate.fileName ||
      crypto.randomUUID()

    return {
      ...candidate,
      candidateId: candidateKey,
      candidateKey,
      jobId: selectedJobId,
      roleTitle: jobTitle,
    }
  }
)

      const {
  data: { user },
} = await supabase.auth.getUser()

if (user) {
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (membership) {
    await supabase.from("candidates").upsert(
      analysedCandidates.map((candidate: any) => ({
        team_id: membership.team_id,

        candidate_key: candidate.candidateKey,

        name:
          candidate.candidateName ||
          candidate.name ||
          "Unknown Candidate",

        email: candidate.email || "",
        phone: candidate.phone || "",
        location: candidate.location || "",

        role_title: candidate.roleTitle || jobTitle,
        job_title: jobTitle,
        job_id: selectedJobId || null,

        score: candidate.score || 0,
        recommendation: candidate.recommendation || "",
        years_experience: candidate.yearsExperience || "",

        summary: candidate.summary || "",

        matched_skills: candidate.matchedSkills || [],
        missing_skills: candidate.missingSkills || [],

        good_fit_reasons: candidate.goodFitReasons || [],
        bad_fit_reasons: candidate.badFitReasons || [],

        experience_history: candidate.experienceHistory || [],
        education: candidate.education || [],
        certifications: candidate.certifications || [],

        raw_candidate: candidate,

        updated_at: new Date().toISOString(),
      })),
      {
        onConflict: "team_id,candidate_key",
      }
    )
    
  }
}

const {
  data: { user: usageUser },
} = await supabase.auth.getUser()

if (usageUser) {
  const { data: usageMembership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", usageUser.id)
    .maybeSingle()

  if (usageMembership?.team_id) {
    await incrementAnalysesUsed(
      usageMembership.team_id,
      analysedCandidates.length
    )

    window.dispatchEvent(new Event("usage-updated"))
  }
}

      setResults(analysedCandidates)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
    }
  }

  const exportShortlist = async () => {
    try {
      if (!results.length) {
        alert("No candidates to export yet.")
        return
      }

      const JSZip = (await import("jszip")).default
      const jsPDFModule = await import("jspdf")
      const autoTableModule = await import("jspdf-autotable")

      const jsPDF = jsPDFModule.default
      const autoTable = autoTableModule.default

      const zip = new JSZip()
      const selectedJob = savedJobs.find(
  (job) => job.id === selectedJobId
)

const safeJobTitle =
  jobTitle ||
  selectedJob?.title ||
  results?.[0]?.roleTitle ||
  "Untitled Job"
      const safeFileName = safeJobTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()

      const sorted = [...results].sort(
        (a, b) => Number(b.score || 0) - Number(a.score || 0)
      )

      const shortlist = sorted.filter(
        (candidate) => Number(candidate.score || 0) >= 80
      )

      const exportCandidates = shortlist.length ? shortlist : sorted

      const doc = new jsPDF()

      doc.setFillColor(124, 58, 237)
      doc.rect(0, 0, 210, 34, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.text("Nuviq Shortlist Report", 14, 17)

      doc.setFontSize(10)
      doc.text("Job: " + safeJobTitle, 14, 27)
      doc.text("Candidates: " + String(exportCandidates.length), 155, 27)

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(13)
      doc.text("Ranked Candidate Summary", 14, 48)

      autoTable(doc, {
        startY: 56,
        head: [["Rank", "Candidate", "Email", "Score", "Recommendation", "Top Skills"]],
        body: exportCandidates.map((candidate, index) => [
          String(index + 1),
          candidate.candidateName || candidate.name || "Unnamed Candidate",
          candidate.email || "Not provided",
          String(candidate.score || 0) + "%",
          candidate.recommendation || "Review",
          (candidate.matchedSkills || []).slice(0, 4).join(", "),
        ]),
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 243, 255],
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
      })

      zip.file("Nuviq-Shortlist-Report.pdf", doc.output("blob"))

      const csvRows = [
        [
          "Rank",
          "Candidate",
          "Email",
          "Score",
          "Recommendation",
          "Matched Skills",
          "Missing Skills",
          "Summary",
        ],
        ...exportCandidates.map((candidate, index) => [
          index + 1,
          candidate.candidateName || candidate.name || "Unnamed Candidate",
          candidate.email || "",
          candidate.score || 0,
          candidate.recommendation || "",
          (candidate.matchedSkills || []).join("; "),
          (candidate.missingSkills || []).join("; "),
          candidate.summary || "",
        ]),
      ]

      const csv = csvRows
        .map((row) =>
          row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(",")
        )
        .join("\n")

      zip.file("shortlist.csv", csv)

      zip.file(
        "shortlist.json",
        JSON.stringify(
          {
            jobTitle: safeJobTitle,
            jobDescription,
            exportedAt: new Date().toISOString(),
            candidates: exportCandidates,
          },
          null,
          2
        )
      )

      let htmlRows = ""

      exportCandidates.forEach((candidate, index) => {
        htmlRows +=
          "<tr>" +
          "<td>" +
          String(index + 1) +
          "</td>" +
          "<td>" +
          (candidate.candidateName || candidate.name || "Unnamed Candidate") +
          "</td>" +
          "<td>" +
          String(candidate.score || 0) +
          "%</td>" +
          "<td>" +
          (candidate.recommendation || "Review") +
          "</td>" +
          "</tr>"
      })

      const html =
        "<html><head><style>" +
        "body{font-family:Arial,sans-serif;padding:40px;color:#0f172a;background:#f8fafc;}" +
        "h1{color:#6d28d9;}" +
        ".card{background:white;border:1px solid #ddd6fe;border-radius:24px;padding:24px;}" +
        "table{width:100%;border-collapse:collapse;margin-top:20px;background:white;}" +
        "th{background:#7c3aed;color:white;padding:12px;text-align:left;}" +
        "td{border-bottom:1px solid #e5e7eb;padding:12px;}" +
        "</style></head><body>" +
        "<div class='card'>" +
        "<h1>Nuviq Shortlist Report</h1>" +
        "<p><strong>Job:</strong> " +
        safeJobTitle +
        "</p>" +
        "<p><strong>Exported:</strong> " +
        new Date().toLocaleString("en-GB") +
        "</p>" +
        "<table><thead><tr><th>Rank</th><th>Candidate</th><th>Score</th><th>Recommendation</th></tr></thead><tbody>" +
        htmlRows +
        "</tbody></table>" +
        "</div></body></html>"

      zip.file("shortlist.html", html)

      zip.file(
        "job-details.txt",
        "Job Title: " + safeJobTitle + "\n\nJob Description:\n" + jobDescription
      )

      zip.file(
        "README.txt",
        "Nuviq Shortlist Export\n\nIncluded files:\n- Nuviq-Shortlist-Report.pdf\n- shortlist.csv\n- shortlist.json\n- shortlist.html\n- job-details.txt\n"
      )

      const blob = await zip.generateAsync({ type: "blob" })

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = safeFileName + "-shortlist.zip"
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error(error)
      alert("Export failed. Make sure jszip, jspdf and jspdf-autotable are installed.")
    }
  }

  const shareResults = async () => {
  if (!results.length) {
    alert("No candidate results to share yet.")
    return
  }

  const selectedJob = savedJobs.find((job) => job.id === selectedJobId)

  const safeJobTitle =
    jobTitle ||
    selectedJob?.title ||
    results?.[0]?.roleTitle ||
    "Untitled Job"

  const sorted = [...results].sort(
    (a, b) => Number(b.score || 0) - Number(a.score || 0)
  )

  const shortlist = sorted.slice(0, 5)

  const shareText =
    `Nuviq Candidate Shortlist\n\n` +
    `Role: ${safeJobTitle}\n` +
    `Candidates analysed: ${results.length}\n\n` +
    shortlist
      .map((candidate, index) => {
        const name =
          candidate.candidateName ||
          candidate.name ||
          "Unnamed Candidate"

        return `${index + 1}. ${name} — ${candidate.score || 0}% match\n${candidate.email || "No email"}\n${candidate.recommendation || "Review"}`
      })
      .join("\n\n")

  try {
    if (navigator.share) {
      await navigator.share({
        title: `Nuviq Shortlist: ${safeJobTitle}`,
        text: shareText,
      })
      return
    }

    await navigator.clipboard.writeText(shareText)
    alert("Shortlist copied to clipboard.")
  } catch (error) {
    console.error(error)

    const subject = encodeURIComponent(`Nuviq Shortlist: ${safeJobTitle}`)
    const body = encodeURIComponent(shareText)

    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }
}

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 space-y-6 px-8 py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[34px] font-bold tracking-tight text-slate-950">
                Candidate Ranking Report
              </h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">
                Upload CVs, connect them to a role and let Nuviq rank the strongest applicants.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={exportShortlist}
                variant="outline"
                className="h-11 gap-2 rounded-2xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <Download className="h-4 w-4" />
                Export Shortlist
              </Button>

              <Button
                onClick={shareResults}
                className="h-11 gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700"
              >
                <Send className="h-4 w-4" />
                Share Results
              </Button>
            </div>
          </div>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-6 p-6 xl:grid-cols-[1fr_1.1fr]">
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                      <Star className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-950">
                        Role details
                      </h2>
                      <p className="text-sm font-medium text-slate-500">
                        Select a saved job or paste a new description.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Saved Jobs
                      </label>

                      <select
                        value={selectedJobId}
                        onChange={(e) => handleSelectSavedJob(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      >
                        <option value="">Select a saved job...</option>

                        {savedJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Job Title
                      </label>

                      <input
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Frontend Developer"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Job Description
                      </label>

                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        className="min-h-[145px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Or Import From URL
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Job Posting URL
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      placeholder="https://company.com/jobs/frontend-developer"
                      className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />

                    <button
                      type="button"
                      onClick={handleImportJobUrl}
                      disabled={importingJobUrl}
                      className="h-12 rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {importingJobUrl ? "Importing..." : "Import"}
                    </button>
                  </div>

                  {jobUrlError && (
                    <p className="mt-3 text-sm font-semibold text-red-600">
                      {jobUrlError}
                    </p>
                  )}
                </div>
              </div>

              <label className="group flex min-h-[430px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50 via-white to-slate-50 px-8 py-12 text-center transition hover:border-violet-400 hover:from-violet-100/80 hover:shadow-sm">
                <input
                  type="file"
                  multiple
                  accept=".zip,.docx,.pdf,.csv"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="hidden"
                />

                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-violet-600 shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">
                  <UploadCloud size={34} />
                </div>

                <p className="text-lg font-bold text-slate-950">
                  Drag & drop candidate files here
                </p>

                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  Upload PDF, DOCX, ZIP folders, or optional CSV metadata.
                  Nuviq will extract, score and rank every candidate.
                </p>

                <div className="mt-6 rounded-2xl border border-violet-200 bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition group-hover:border-violet-300 group-hover:bg-violet-50">
                  Browse Files
                </div>

                {files.length > 0 && (
                  <p className="mt-4 rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
                    {files.length} file{files.length === 1 ? "" : "s"} selected
                  </p>
                )}
              </label>
            </div>

            {loading && total > 0 && (
              <div className="border-t border-slate-200 px-6 py-5">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Analysing candidates</span>
                  <span>
                    {completed} of {total}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-violet-100">
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all duration-500"
                    style={{
                      width: String(
                        Math.min(100, Math.round((completed / total) * 100))
                      ) + "%",
                    }}
                  />
                </div>

                <p className="mt-2 text-xs font-medium text-slate-500">
                  Reading CVs, extracting skills and ranking applicants...
                </p>
              </div>
            )}

            {error && (
              <div className="mx-6 mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <button
                onClick={handleAnalyse}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analysing Candidates..." : "Analyse Candidates"}
              </button>

              <p className="text-sm font-medium text-slate-500">
                Nuviq will extract, score and rank all candidates.
              </p>
            </div>
          </section>

          <StatsCards results={results} />
          <TopCandidatesPodium
  results={results.filter((candidate) => !candidate.extractionFailed)}
/>

          <div id="all-candidates">
            <CandidateTable candidates={results} />
          </div>

          <ScoreLegend />
        </main>

        <Footer />
      </div>
    </div>
  )
}