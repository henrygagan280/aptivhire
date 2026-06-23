"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/browser"
import Link from "next/link"
import {
  Eye,
  Mail,
  MoreHorizontal,
  FileText,
  Search,
  Trash2,
  Send,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Recommendation =
  | "Strong Interview"
  | "Interview"
  | "Review"
  | "Possible Review"
  | "Reject"

const getRecommendationStyle = (recommendation: Recommendation) => {
  switch (recommendation) {
    case "Strong Interview":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "Interview":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "Review":
    case "Possible Review":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "Reject":
      return "border-red-200 bg-red-50 text-red-700"
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-violet-600"
  if (score >= 65) return "bg-indigo-500"
  if (score >= 50) return "bg-amber-400"
  return "bg-red-400"
}

function getRankBadge(rank?: number) {
  if (!rank) return "-"
  if (rank === 1) return "🥇"
  if (rank === 2) return "🥈"
  if (rank === 3) return "🥉"
  return rank.toString()
}

export function CandidateTable({ candidates }: { candidates: any[] }) {
  const [page, setPage] = useState(1)
  const perPage = 25

  const [search, setSearch] = useState("")
  const [recommendationFilter, setRecommendationFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  
  const [senderEmail, setSenderEmail] = useState("")
  const [openMenuRank, setOpenMenuRank] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState("")

  useEffect(() => {
  async function loadSenderEmail() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("default_sender_email")
      .eq("id", user.id)
      .single()

    setSenderEmail(profile?.default_sender_email || user.email || "")
  }

  loadSenderEmail()
}, [])

const showToast = (message: string) => {
  setToastMessage(message)

  setTimeout(() => {
    setToastMessage("")
  }, 2500)
}

const copyCandidateEmail = async (candidate: any) => {
  if (!candidate.email) {
    showToast("No email found for this candidate.")
    return
  }

  await navigator.clipboard.writeText(candidate.email)
  showToast("Candidate email copied.")
}

const downloadCandidateJson = (candidate: any) => {
  const blob = new Blob(
    [JSON.stringify(candidate, null, 2)],
    { type: "application/json" }
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${candidate.candidateName || "candidate"}-profile.json`
  link.click()

  URL.revokeObjectURL(url)

  showToast("Candidate profile downloaded.")
}

  const [rejectSubject, setRejectSubject] = useState("Update on your application")
  const [rejectBody, setRejectBody] = useState(`Hi {{candidateName}},

Thank you for applying for the role.

After reviewing your application, we have decided not to move forward at this stage.

We appreciate the time you took to apply and wish you the best in your job search.

Kind regards,
The Hiring Team`)

  const [inviteSubject, setInviteSubject] = useState("Interview invitation")
  const [inviteBody, setInviteBody] = useState(`Hi {{candidateName}},

Thank you for applying for the role.

We were impressed with your application and would like to invite you to interview.

Please reply with your availability over the next few days and we will confirm a suitable time.

Kind regards,
The Hiring Team`)

  const filteredCandidates = candidates.filter((candidate) => {
    const name = candidate.candidateName?.toLowerCase() || ""
    const email = candidate.email?.toLowerCase() || ""
    const recommendation = candidate.recommendation || ""
    const score = Number(candidate.score || 0)

    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase())

    const matchesRecommendation =
      recommendationFilter === "all" || recommendation === recommendationFilter

    const matchesScore =
      scoreFilter === "all" ||
      (scoreFilter === "80-100" && score >= 80) ||
      (scoreFilter === "50-79" && score >= 50 && score <= 79) ||
      (scoreFilter === "0-49" && score < 50)

    return matchesSearch && matchesRecommendation && matchesScore
  })

  const totalPages = Math.ceil(filteredCandidates.length / perPage)
  const start = (page - 1) * perPage
  const visibleCandidates = filteredCandidates.slice(start, start + perPage)

  const selectedCandidateObjects = filteredCandidates.filter((candidate) =>
    selectedCandidates.includes(candidate.rank)
  )

  const clearResults = () => {
    const confirmed = window.confirm("Clear all analysed candidates?")
    if (!confirmed) return

    localStorage.removeItem("aptivhire-results")
    window.location.reload()
  }

  

  const toggleCandidate = (rank: number) => {
    setSelectedCandidates((current) =>
      current.includes(rank)
        ? current.filter((id) => id !== rank)
        : [...current, rank]
    )
  }

  const toggleAllVisible = () => {
    const visibleRanks = visibleCandidates.map((candidate) => candidate.rank)
    const allSelected = visibleRanks.every((rank) =>
      selectedCandidates.includes(rank)
    )

    setSelectedCandidates((current) =>
      allSelected
        ? current.filter((rank) => !visibleRanks.includes(rank))
        : Array.from(new Set([...current, ...visibleRanks]))
    )
  }

  const selectByScoreBelow = (threshold: number) => {
    const matchingRanks = filteredCandidates
      .filter((candidate) => Number(candidate.score || 0) < threshold)
      .map((candidate) => candidate.rank)

    setSelectedCandidates(matchingRanks)
  }

  return (
  <>
    {toastMessage && (
      <div className="fixed right-6 top-6 z-[9999] rounded-2xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xl">
        {toastMessage}
      </div>
    )}

    <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-white via-violet-50/40 to-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Candidate Results
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Review, filter, shortlist and prepare candidate communications.
            </p>
          </div>

          <button
            onClick={clearResults}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
          >
            <Trash2 size={16} />
            Clear Results
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search candidates..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <select
            value={recommendationFilter}
            onChange={(e) => {
              setRecommendationFilter(e.target.value)
              setPage(1)
            }}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          >
            <option value="all">All Recommendations</option>
            <option value="Strong Interview">Strong Interview</option>
            <option value="Interview">Interview</option>
            <option value="Review">Review</option>
            <option value="Possible Review">Possible Review</option>
            <option value="Reject">Reject</option>
          </select>

          <select
            value={scoreFilter}
            onChange={(e) => {
              setScoreFilter(e.target.value)
              setPage(1)
            }}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          >
            <option value="all">All Scores</option>
            <option value="80-100">80 - 100</option>
            <option value="50-79">50 - 79</option>
            <option value="0-49">0 - 49</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 font-semibold text-slate-700">
            Quick select:
          </span>

          {[80, 70, 60, 50, 40].map((threshold) => (
            <button
              key={threshold}
              onClick={() => selectByScoreBelow(threshold)}
              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              Under {threshold}%
            </button>
          ))}

          <button
            onClick={() => {
              const matchingRanks = filteredCandidates
                .filter((candidate) => Number(candidate.score || 0) >= 80)
                .map((candidate) => candidate.rank)

              setSelectedCandidates(matchingRanks)
            }}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Select 80%+
          </button>

          <button
            onClick={() => setSelectedCandidates([])}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Clear Selection
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl"
          >
            Previous
          </Button>

          <span className="text-sm font-semibold text-slate-600">
            Page {page} of {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      </div>

      {selectedCandidates.length > 0 && (
        <div className="flex flex-col gap-3 border-b border-violet-200 bg-violet-50 px-6 py-4 text-sm md:flex-row md:items-center md:justify-between">
          <span className="font-semibold text-violet-900">
            {selectedCandidates.length} candidate
            {selectedCandidates.length === 1 ? "" : "s"} selected
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCandidates([])}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X size={15} />
              Clear
            </button>

            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700"
            >
              <Send size={15} />
              Prepare invites
            </button>

            <button
              onClick={() => setShowRejectModal(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              <Mail size={15} />
              Prepare rejections
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50/80 hover:bg-slate-50">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={
                    visibleCandidates.length > 0 &&
                    visibleCandidates.every((candidate) =>
                      selectedCandidates.includes(candidate.rank)
                    )
                  }
                  onChange={toggleAllVisible}
                  className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                />
              </TableHead>

              <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                Rank
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Candidate
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fit Score
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recommendation
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Key Strengths
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Missing Skills
              </TableHead>
              <TableHead className="sticky right-0 z-30 bg-slate-50 text-right text-xs font-bold uppercase tracking-wider text-slate-500 shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.45)]">
  Actions
</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleCandidates.map((candidate, index) => {
              const realIndex = start + index
              const rank =
  candidate.extractionFailed
    ? null
    : candidate.rank || realIndex + 1

              const podiumClass =
                rank === 1
                  ? "bg-amber-50/60"
                  : rank === 2
                  ? "bg-slate-50/80"
                  : rank === 3
                  ? "bg-orange-50/60"
                  : "bg-white"

              return (
                <TableRow
                  key={candidate.fileName || candidate.candidateName || index}
                  className={`border-b border-slate-100 transition hover:bg-violet-50/40 ${podiumClass}`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(rank)}
                      onChange={() => toggleCandidate(rank)}
                      className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                    />
                  </TableCell>

                  <TableCell className="text-center">
                    <span className="text-lg font-bold text-slate-700">
                      {candidate.extractionFailed
  ? "—"
  : getRankBadge(rank)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3 py-2">
                      <Avatar className="h-11 w-11 ring-2 ring-violet-100">
                        <AvatarImage
                          src={candidate.avatar}
                          alt={candidate.candidateName}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-orange-300 text-sm font-bold text-white">
                          {(candidate.candidateName ||
                            candidate.fileName ||
                            "?")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-semibold text-slate-950">
                          {candidate.candidateName}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {candidate.email}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <FileText className="h-3 w-3" />
                          <span>{candidate.cvFile}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
  <div className="space-y-2">
    <span className="text-sm font-bold text-slate-950">
      {candidate.score}%
    </span>

    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${getScoreColor(
          candidate.score
        )}`}
        style={{ width: `${candidate.score}%` }}
      />
    </div>

    <p className="text-xs font-medium text-slate-500">
      {candidate.fitLabel}
    </p>

    {candidate.whyRankedHere && (
  <span
    title={candidate.whyRankedHere}
    className="cursor-help text-xs font-semibold text-violet-600"
  >
    Why?
  </span>
)}
  </div>
</TableCell>

                  <TableCell>
                    <Badge
  variant="outline"
  className={
    candidate.extractionFailed
      ? "border-red-200 bg-red-50 text-red-700 rounded-full px-3 py-1 font-semibold"
      : `${getRecommendationStyle(
          candidate.recommendation
        )} rounded-full px-3 py-1 font-semibold`
  }
>
  {candidate.extractionFailed
    ? "Needs Re-upload"
    : candidate.recommendation}
</Badge>
                  </TableCell>

                  <TableCell>
  {candidate.extractionFailed ? (
    <div>
      <p className="font-semibold text-red-600">
        Unreadable CV
      </p>
      <p className="text-xs text-slate-500">
        Please re-upload as DOCX or text-based PDF
      </p>
    </div>
  ) : (
    <ul className="space-y-1">
      {(candidate.strengths || candidate.matchedSkills || [])
        .slice(0, 4)
        .map((strength: string, i: number) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm font-medium text-slate-500"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
            <span>{strength}</span>
          </li>
        ))}
    </ul>
  )}
</TableCell>

                  <TableCell>
                    <ul className="space-y-1">
                      {(candidate.missingSkills || [])
                        .slice(0, 3)
                        .map((skill: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm font-medium text-slate-500"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                            <span>{skill}</span>
                          </li>
                        ))}
                    </ul>
                  </TableCell>

                  <TableCell className="sticky right-0 z-20 bg-white text-right shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.45)]">
  <div className="flex min-w-[120px] items-center justify-end gap-1">
                      <Link
  
  href={`/candidates/${candidate.candidateKey || rank}?rank=${rank}`}
>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-slate-400 hover:bg-violet-50 hover:text-violet-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
  variant="ghost"
  size="icon"
  onClick={() => {
  if (!rank) return
  setSelectedCandidates([rank])
  setShowInviteModal(true)
}}
  className="h-9 w-9 rounded-xl text-slate-400 hover:bg-violet-50 hover:text-violet-700"
>
  <Mail className="h-4 w-4" />
</Button>

                      <div className="relative">
  <Button
    variant="ghost"
    size="icon"
    onClick={() =>
      setOpenMenuRank(openMenuRank === rank ? null : rank)
    }
    className="h-9 w-9 rounded-xl text-slate-400 hover:bg-violet-50 hover:text-violet-700"
  >
    <MoreHorizontal className="h-4 w-4" />
  </Button>

  {openMenuRank === rank && (
  <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
    <button
      onClick={() => {
        copyCandidateEmail(candidate)
        setOpenMenuRank(null)
      }}
      className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Copy email
    </button>

    <Link
      href={`/candidates/${candidate.candidateKey || rank}?rank=${rank}`}
      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      View profile
    </Link>

    <button
      onClick={() => {
        if (!rank) return
        setSelectedCandidates([rank])
        setShowInviteModal(true)
        setOpenMenuRank(null)
      }}
      className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Prepare invite
    </button>

    <button
      onClick={() => {
        if (!rank) return
        setSelectedCandidates([rank])
        setShowRejectModal(true)
        setOpenMenuRank(null)
      }}
      className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
    >
      Prepare rejection
    </button>

    <button
      onClick={() => {
        downloadCandidateJson(candidate)
        setOpenMenuRank(null)
      }}
      className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Download profile
    </button>
  </div>
)}
</div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-slate-500">
          Showing {start + 1} to{" "}
          {Math.min(start + perPage, filteredCandidates.length)} of{" "}
          {filteredCandidates.length} candidates
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm font-semibold text-slate-600">
            Page {page} of {totalPages || 1}
          </span>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {showInviteModal && (
        <EmailModal
          title="Prepare interview invite emails"
          description={`You are preparing interview invite emails for ${
            selectedCandidateObjects.length
          } selected candidate${
            selectedCandidateObjects.length === 1 ? "" : "s"
          }.`}
          senderEmail={senderEmail}
          setSenderEmail={setSenderEmail}
          subject={inviteSubject}
          setSubject={setInviteSubject}
          body={inviteBody}
          setBody={setInviteBody}
          candidates={selectedCandidateObjects}
          onClose={() => setShowInviteModal(false)}
          onConfirm={() =>
            alert(
              `Prepared ${selectedCandidateObjects.length} invite email(s). Email sending will be connected next.`
            )
          }
          confirmText="Confirm & Prepare Invites"
          confirmClass="bg-violet-600 hover:bg-violet-700 shadow-violet-200"
        />
      )}

      {showRejectModal && (
        <EmailModal
          title="Prepare rejection emails"
          description={`You are preparing emails for ${
            selectedCandidateObjects.length
          } selected candidate${
            selectedCandidateObjects.length === 1 ? "" : "s"
          }.`}
          senderEmail={senderEmail}
          setSenderEmail={setSenderEmail}
          subject={rejectSubject}
          setSubject={setRejectSubject}
          body={rejectBody}
          setBody={setRejectBody}
          candidates={selectedCandidateObjects}
          onClose={() => setShowRejectModal(false)}
          onConfirm={() =>
            alert(
              `Prepared ${selectedCandidateObjects.length} rejection email(s). Email sending will be connected next.`
            )
          }
          confirmText="Confirm & Prepare Emails"
          confirmClass="bg-red-600 hover:bg-red-700"
        />
      )}
    </Card>
    </>
  )
}

function EmailModal({
  title,
  description,
  senderEmail,
  setSenderEmail,
  subject,
  setSubject,
  body,
  setBody,
  candidates,
  onClose,
  onConfirm,
  confirmText,
  confirmClass,
}: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Sending from">
            <input
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </Field>

          <Field label="Subject line">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </Field>

          <Field label="Email template">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={9}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
            <p className="mt-2 text-xs font-medium text-slate-500">
              Use {"{{candidateName}}"} to personalise each email.
            </p>
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Recipients
            </p>

            <div className="max-h-32 overflow-y-auto text-sm text-slate-600">
              {candidates.map((candidate: any) => (
                <div
                  key={candidate.rank}
                  className="flex justify-between border-b border-slate-200 py-1.5 last:border-b-0"
                >
                  <span>{candidate.candidateName}</span>
                  <span>{candidate.email || "No email found"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className={`h-11 rounded-2xl px-5 text-sm font-semibold text-white shadow-sm ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  )
}