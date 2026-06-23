"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Download,
  Mail,
  MapPin,
  Phone,
  CheckCircle,
  AlertTriangle,
  Users,
  X,
  Briefcase,
  Code2,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  NotebookPen,
  Calendar,
} from "lucide-react"
import { createClient } from "@/lib/supabase/browser"

type ExperienceItem = {
  title?: string
  company?: string
  location?: string
  startDate?: string
  endDate?: string
  description?: string
  technologies?: string[]
}

type EducationItem = {
  institution?: string
  qualification?: string
  date?: string
  startDate?: string
  endDate?: string
}

type CertificationItem =
  | string
  | {
      name?: string
      year?: string
      issuer?: string
    }

type Candidate = {
  rank?: number
  candidateName?: string
  name?: string
  email?: string
  phone?: string
  location?: string
  score?: number
  recommendation?: string
  roleTitle?: string
  yearsExperience?: string
  matchedSkills?: string[]
  missingSkills?: string[]
  goodFitReasons?: string[]
  badFitReasons?: string[]
  experienceHistory?: ExperienceItem[]
  education?: EducationItem[]
  certifications?: CertificationItem[]
  summary?: string
  candidateKey?: string
  candidateId?: string
}

export default function CandidateProfilePage() {
  const params = useParams()
  const id = params.id as string
  const searchParams = useSearchParams()
  const rankParam = searchParams.get("rank")

  const fromPipeline = searchParams.get("from") === "pipeline"
  const pipelineStage = searchParams.get("stage")
  const canInviteFromThisPage = !fromPipeline || pipelineStage === "Screening"

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [notes, setNotes] = useState<string[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showInterviewPrepModal, setShowInterviewPrepModal] = useState(false)
  const [noteText, setNoteText] = useState("")
  const supabase = createClient()
const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
  const loadCandidate = async () => {
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
        let dbCandidate = null

const { data: candidateById } = await supabase
  .from("candidates")
  .select("*")
  .eq("team_id", membership.team_id)
  .eq("id", id)
  .maybeSingle()

dbCandidate = candidateById

if (!dbCandidate) {
  const { data: candidateByKey } = await supabase
    .from("candidates")
    .select("*")
    .eq("team_id", membership.team_id)
    .eq("candidate_key", id)
    .maybeSingle()

  dbCandidate = candidateByKey
}

        if (dbCandidate) {
          setCandidate({
            rank: undefined,
            candidateName: dbCandidate.name,
            name: dbCandidate.name,
            email: dbCandidate.email,
            phone: dbCandidate.phone,
            location: dbCandidate.location,
            roleTitle: dbCandidate.role_title,
            score: dbCandidate.score,
            recommendation: dbCandidate.recommendation,
            yearsExperience: dbCandidate.years_experience,
            matchedSkills: dbCandidate.matched_skills || [],
            missingSkills: dbCandidate.missing_skills || [],
            goodFitReasons: dbCandidate.good_fit_reasons || [],
            badFitReasons: dbCandidate.bad_fit_reasons || [],
            experienceHistory: dbCandidate.experience_history || [],
            education: dbCandidate.education || [],
            certifications: dbCandidate.certifications || [],
            summary: dbCandidate.summary,
          })

          return
        }
      }
    }

    const fallbackFromUrl = {
  candidateName: searchParams.get("name") || "Unknown Candidate",
  name: searchParams.get("name") || "Unknown Candidate",
  email: searchParams.get("email") || "",
  score: Number(searchParams.get("score") || 0),
  recommendation: searchParams.get("recommendation") || "Review",
  matchedSkills: [],
  missingSkills: [],
  goodFitReasons: [],
  badFitReasons: [],
  experienceHistory: [],
  education: [],
  certifications: [],
  summary: "",
}

const savedResults = localStorage.getItem("aptivhire-results")

if (!savedResults) {
  setCandidate(fallbackFromUrl)
  return
}

const candidates: Candidate[] = JSON.parse(savedResults)

const foundCandidate = candidates.find((c, index) => {
  const rankMatch =
    rankParam && String(c.rank) === rankParam

  const idMatch =
    String(c.candidateKey) === id ||
    String(c.candidateId) === id ||
    String(c.rank) === id ||
    String(index) === id ||
    String(index + 1) === id

  return rankMatch || idMatch
})

setCandidate(foundCandidate || fallbackFromUrl)
  }

  loadCandidate()
}, [id])

  useEffect(() => {
    const savedNotes = localStorage.getItem(`aptivhire-notes-${id}`)
    if (savedNotes) setNotes(JSON.parse(savedNotes))
  }, [id])

  useEffect(() => {
  const loadTeam = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) return

    setTeamId(membership.team_id)
  }

  loadTeam()
}, [])

  if (!candidate) {
    return (
      <main className="min-h-screen bg-slate-50 px-8 py-7 text-slate-950">
        <div className="mx-auto max-w-7xl">
          <BackLink fromPipeline={fromPipeline} />

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm">
            <h1 className="text-2xl font-bold">Candidate not found</h1>
            <p className="mt-2 text-slate-600">
              Return to the dashboard and open the candidate again.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const name = candidate.candidateName || candidate.name || "Unknown Candidate"
  const initials = getInitials(name)
  const score = candidate.score || 0
  const recommendation = candidate.recommendation || "Review Candidate"
  const matchedSkills = candidate.matchedSkills || []
  const missingSkills = candidate.missingSkills || []
  const goodFitReasons = candidate.goodFitReasons || []
  const badFitReasons = candidate.badFitReasons || []
  const experienceHistory = candidate.experienceHistory || []
  const education = candidate.education || []
  const certifications = candidate.certifications || []
  const candidateRecordId = id

  const saveNote = () => {
    if (!noteText.trim()) return

    const updatedNotes = [...notes, noteText.trim()]
    setNotes(updatedNotes)
    localStorage.setItem(`aptivhire-notes-${id}`, JSON.stringify(updatedNotes))
    setNoteText("")
    setShowNoteModal(false)
  }

  const downloadCandidateProfile = () => {
    const content = `
Candidate Profile

Name: ${name}
Email: ${candidate.email || "Not provided"}
Phone: ${candidate.phone || "Not provided"}
Location: ${candidate.location || "Not provided"}
Role: ${candidate.roleTitle || "Not specified"}
Fit Score: ${score}%
Recommendation: ${recommendation}

Summary:
${candidate.summary || "No summary available."}

Matched Skills:
${matchedSkills.join(", ") || "None listed"}

Missing / Weak Skills:
${missingSkills.join(", ") || "None listed"}

Why They Could Be a Good Fit:
${goodFitReasons.join("\n") || "No strengths listed."}

Why They Might Not Be a Good Fit:
${badFitReasons.join("\n") || "No concerns listed."}
`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-candidate-profile.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const moveCandidateToPipeline = async (
  candidateStage: "Contacted" | "Rejected",
  activity: string
) => {
  if (!candidate || !teamId) {
    alert("Team or candidate not loaded yet.")
    return
  }

  const candidateName =
    candidate.candidateName || candidate.name || "Candidate"

  const candidateId = candidateRecordId

  await supabase
  .from("candidates")
  .upsert(
    {
      team_id: teamId,
      candidate_key: candidateId,
      name: candidateName,
      email: candidate.email || "",
      phone: candidate.phone || "",
      location: candidate.location || "",
      role_title: candidate.roleTitle || "Unknown Job",
      job_title: candidate.roleTitle || "Unknown Job",
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
    },
    {
      onConflict: "team_id,candidate_key",
    }
  )

  const lastUpdated = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

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
        status: candidateStage,
        communication_status:
          candidateStage === "Contacted"
            ? "Invite prepared"
            : "Rejection prepared",
        last_updated: lastUpdated,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "team_id,candidate_id",
      }
    )

  if (error) {
  console.error("Failed to move candidate to pipeline:", error)
  alert("Could not add candidate to pipeline.")
  return
}

const emailThreadStatus =
  candidateStage === "Contacted"
    ? "Invite sent"
    : "Rejection sent"

const emailThreadSubject =
  candidateStage === "Contacted"
    ? "Interview invitation"
    : "Application update"

const emailThreadMessage =
  candidateStage === "Contacted"
    ? "Interview invite email prepared. No reply received yet."
    : "Rejection email prepared. No reply received yet."

const { error: emailThreadError } = await supabase
  .from("email_threads")
  .insert({
    team_id: teamId,
    candidate_id: candidateId,
    candidate_name: candidateName,
    candidate_email: candidate.email || "",
    job_title: candidate.roleTitle || "Unknown Job",
    status: emailThreadStatus,
    subject: emailThreadSubject,
    last_message: emailThreadMessage,
  })

if (emailThreadError) {
  console.error(
    "Failed to create email thread:",
    emailThreadError
  )
}

localStorage.setItem("aptivhire-activity", JSON.stringify([activity]))
}

  return (
    <main className="min-h-screen bg-slate-50 px-8 py-7 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <BackLink fromPipeline={fromPipeline} />

          <div className="flex items-center gap-3">
            <button
              onClick={downloadCandidateProfile}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              <Download size={16} />
              Download Profile
            </button>

            <button
              onClick={() => setShowNoteModal(true)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
            >
              <NotebookPen size={16} />
              Add Note
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-7 lg:grid-cols-[1.6fr_0.55fr_0.9fr]">
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-300 text-3xl font-bold text-white shadow-lg shadow-violet-100">
                {initials}
              </div>

              <div>
                <h1 className="text-[38px] font-bold tracking-tight text-slate-950">
                  {name}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-5 text-sm font-medium text-slate-500">
                  {candidate.email && (
                    <span className="inline-flex items-center gap-2">
                      <Mail size={15} />
                      {candidate.email}
                    </span>
                  )}

                  {candidate.phone && (
                    <span className="inline-flex items-center gap-2">
                      <Phone size={15} />
                      {candidate.phone}
                    </span>
                  )}

                  {candidate.location && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={15} />
                      {candidate.location}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{candidate.roleTitle || "Software Developer"}</Badge>
                  <Badge>{candidate.yearsExperience || inferYears(experienceHistory)}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-5">
              <p className="text-sm font-bold text-slate-700">Fit Score</p>
              <p className={`mt-2 text-5xl font-bold ${score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                {score}%
              </p>
              <span className={`mt-3 inline-flex rounded-full px-4 py-1 text-sm font-bold ${score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                {score >= 80 ? "Strong Match" : score >= 50 ? "Possible Match" : "Weak Match"}
              </span>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-700">Recommendation</p>
              <h2 className="mt-2 text-3xl font-bold text-violet-700">
                {recommendation}
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                {score >= 80
                  ? "Strong candidate for this role. High potential impact."
                  : score >= 60
                    ? "Potentially suitable candidate. Review gaps before progressing."
                    : "Candidate may need further review before progressing."}
              </p>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr_1.05fr]">
          <FitCard
  title="Why They Could Be a Good Fit"
  icon={<CheckCircle size={23} />}
  variant="positive"
  items={
    goodFitReasons.length
      ? goodFitReasons
      : score >= 50
        ? ["There may be some relevant experience, but Nuviq did not extract enough strong evidence to list specific fit reasons."]
        : ["No strong fit reasons were identified for this role."]
  }
/>

          <FitCard
  title="Potential Concerns"
  icon={<AlertTriangle size={23} />}
  variant="warning"
  items={
    badFitReasons.length
      ? badFitReasons
      : score < 50
        ? ["The candidate appears to be a weak match for this role, but Nuviq did not extract detailed concern points from the CV."]
        : ["No major concerns were identified from the available CV evidence."]
  }
/>

          <div className="space-y-6">
            <Card>
              <SectionHeader icon={<Users size={22} />} title="Recruiter Actions" />
              <div className="mt-6 space-y-3">
                {canInviteFromThisPage && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
                  >
                    <Calendar size={16} />
                    Invite to Interview
                  </button>
                )}

                <button
                  onClick={() => setShowInterviewPrepModal(true)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  <NotebookPen size={16} />
                  Prepare for Interview
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <X size={16} />
                  Reject Candidate
                </button>
              </div>
            </Card>

            <Card>
              <SectionHeader icon={<Code2 size={22} />} title="Skills Overview" />

              <div className="mt-6">
                <p className="mb-3 text-sm font-bold text-emerald-700">Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.length
                    ? matchedSkills.map((skill) => <SkillPill key={skill} variant="match">{skill}</SkillPill>)
                    : <EmptyText>No matched skills extracted yet.</EmptyText>}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-bold text-amber-700">Missing / Weak Skills</p>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.length
                    ? missingSkills.map((skill) => <SkillPill key={skill} variant="missing">{skill}</SkillPill>)
                    : <EmptyText>No missing skills extracted yet.</EmptyText>}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <SectionHeader icon={<Briefcase size={23} />} title="Work Experience" />

            <div className="mt-6">
              {experienceHistory.length ? (
                <div className="relative space-y-7 border-l border-violet-200 pl-7">
                  {experienceHistory.map((item, index) => (
                    <div key={index} className="relative">
                      <span className="absolute -left-[34px] top-1 h-3 w-3 rounded-full bg-violet-600 ring-4 ring-white" />

                      <div className="flex justify-between gap-5">
                        <div>
                          <h3 className="font-bold text-slate-950">{item.title || "Role not specified"}</h3>
                          <p className="text-sm font-semibold text-slate-600">{item.company || "Company not specified"}</p>

                          {item.description && (
                            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                              {item.description}
                            </p>
                          )}

                          {item.technologies?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.technologies.map((tech) => (
                                <SkillPill key={tech} variant="neutral">{tech}</SkillPill>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="min-w-36 text-right text-sm font-medium text-slate-500">
                          <p>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</p>
                          {item.location && <p>{item.location}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBox>No work experience has been extracted from this CV yet.</EmptyBox>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader icon={<Sparkles size={23} />} title="AI Summary" />
            <p className="mt-5 text-sm font-medium leading-7 text-slate-600">
              {candidate.summary || "No AI-generated candidate summary is available yet."}
            </p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <SectionHeader icon={<GraduationCap size={23} />} title="Education" />
            <div className="mt-5 space-y-4">
              {education.length ? (
                education.map((item, index) => (
                  <div key={index} className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-950">{item.qualification || "Qualification not specified"}</h3>
                      <p className="text-sm font-medium text-slate-500">{item.institution || "Institution not specified"}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.date || [item.startDate, item.endDate].filter(Boolean).join(" – ")}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyText>No education extracted yet.</EmptyText>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader icon={<ShieldCheck size={23} />} title="Certifications" />
            <div className="mt-5 space-y-3">
              {certifications.length ? (
                certifications.map((cert, index) => {
                  const label =
                    typeof cert === "string"
                      ? cert
                      : [cert.name, cert.issuer].filter(Boolean).join(" — ")

                  const year = typeof cert === "string" ? "" : cert.year

                  return (
                    <div key={index} className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-600">• {label}</p>
                      {year && <p className="text-sm text-slate-500">{year}</p>}
                    </div>
                  )
                })
              ) : (
                <EmptyText>No certifications extracted yet.</EmptyText>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <SectionHeader icon={<NotebookPen size={22} />} title="Candidate Notes" />
              <button
                onClick={() => setShowNoteModal(true)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-violet-50 hover:text-violet-700"
              >
                Add Note
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {notes.length ? (
                notes.map((note, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-950">You</p>
                    <p className="mt-2 text-sm font-medium text-slate-600">{note}</p>
                  </div>
                ))
              ) : (
                <EmptyText>No recruiter notes added yet.</EmptyText>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showInviteModal && (
        <EmailModal
          title="Prepare interview invite email"
          description={`You are preparing an interview invite email for ${name}.`}
          candidateName={name}
          candidateEmail={candidate.email || ""}
          subject="Interview invitation"
          template={`Hi {{candidateName}},

Thank you for applying for the role.

We were impressed with your application and would like to invite you to interview.

Please reply with your availability over the next few days and we will confirm a suitable time.

Kind regards,
The Hiring Team`}
          confirmLabel="Confirm & Prepare Invite"
          onClose={() => {
            moveCandidateToPipeline("Contacted", "Interview invite email prepared")
            setShowInviteModal(false)
          }}
        />
      )}

      {showRejectModal && (
        <EmailModal
          title="Prepare rejection email"
          description={`You are preparing a rejection email for ${name}.`}
          candidateName={name}
          candidateEmail={candidate.email || ""}
          subject="Application update"
          template={`Hi {{candidateName}},

Thank you for applying for the role.

After reviewing your application, we have decided not to progress your application further at this stage.

We appreciate the time you took to apply and wish you the best with your job search.

Kind regards,
The Hiring Team`}
          confirmLabel="Confirm & Prepare Rejection"
          onClose={() => {
            moveCandidateToPipeline("Rejected", "Rejection email prepared")
            setShowRejectModal(false)
          }}
        />
      )}

      {showNoteModal && (
        <NoteModal
          noteText={noteText}
          setNoteText={setNoteText}
          onSave={saveNote}
          onClose={() => setShowNoteModal(false)}
        />
      )}

      {showInterviewPrepModal && (
        <InterviewPrepModal
          name={name}
          candidate={candidate}
          matchedSkills={matchedSkills}
          missingSkills={missingSkills}
          goodFitReasons={goodFitReasons}
          badFitReasons={badFitReasons}
          onClose={() => setShowInterviewPrepModal(false)}
        />
      )}
    </main>
  )
}

function BackLink({ fromPipeline }: { fromPipeline: boolean }) {
  return (
    <Link
      href={fromPipeline ? "/pipeline" : "/analyse-candidates"}
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-700"
    >
      <ArrowLeft size={16} />
      {fromPipeline ? "Back to pipeline" : "Back to candidates"}
    </Link>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 text-violet-700">
      {icon}
      <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
    </div>
  )
}

function FitCard({
  title,
  icon,
  variant,
  items,
}: {
  title: string
  icon: React.ReactNode
  variant: "positive" | "warning"
  items: string[]
}) {
  const isPositive = variant === "positive"

  return (
    <section
      className={`h-fit rounded-[28px] border bg-white p-6 shadow-sm ${
        isPositive ? "border-emerald-200" : "border-amber-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={isPositive ? "text-emerald-600" : "text-amber-600"}>
          {icon}
        </span>
        <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
      </div>

      <div className="mt-6 space-y-6">
        {items.map((item, index) => {
          const [heading, ...rest] = item.split(":")
          const body = rest.join(":").trim()

          return (
            <div key={index} className="flex gap-4">
              <span className={`mt-1 shrink-0 ${isPositive ? "text-emerald-600" : "text-amber-600"}`}>
                {isPositive ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              </span>

              <div>
                <h3 className="font-bold text-slate-950">
                  {body ? heading : formatReasonTitle(item)}
                </h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                  {body || item}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-violet-50 px-4 py-1.5 text-sm font-bold text-violet-700">
      {children}
    </span>
  )
}

function SkillPill({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: "match" | "missing" | "neutral"
}) {
  const styles = {
    match: "bg-emerald-100 text-emerald-700",
    missing: "bg-amber-100 text-amber-700",
    neutral: "bg-slate-100 text-slate-700",
  }

  return (
    <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${styles[variant]}`}>
      {children}
    </span>
  )
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-slate-500">{children}</p>
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-medium text-slate-500">
      {children}
    </div>
  )
}

function EmailModal({
  title,
  description,
  candidateName,
  candidateEmail,
  subject,
  template,
  confirmLabel,
  onClose,
}: {
  title: string
  description: string
  candidateName: string
  candidateEmail: string
  subject: string
  template: string
  confirmLabel: string
  onClose: () => void
}) {
  const [emailSubject, setEmailSubject] = useState(subject)
  const [emailTemplate, setEmailTemplate] = useState(template)

  const [senderEmail, setSenderEmail] = useState("")

useEffect(() => {
  const loadProfile = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("default_sender_email,email")
      .eq("id", user.id)
      .single()

    if (!profile) return

    setSenderEmail(
      profile.default_sender_email ||
      profile.email ||
      user.email ||
      ""
    )
  }

  loadProfile()
}, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
          </div>

          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">
            Close
          </button>
        </div>

        <div className="space-y-4">
          <ModalField label="Sending from">
            <input value={senderEmail} readOnly className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium" />
          </ModalField>

          <ModalField label="Subject line">
            <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
          </ModalField>

          <ModalField label="Email template">
            <textarea value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} rows={9} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              Use {"{{candidateName}}"} to personalise the email.
            </p>
          </ModalField>

          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="mb-2 font-bold text-slate-800">Recipient</h3>
            <div className="flex justify-between border-b border-slate-200 py-2 text-sm">
              <span>{candidateName}</span>
              <span className="text-slate-600">{candidateEmail}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-semibold hover:bg-slate-50">
            Cancel
          </button>

          <button onClick={onClose} className="h-11 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function NoteModal({
  noteText,
  setNoteText,
  onSave,
  onClose,
}: {
  noteText: string
  setNoteText: (value: string) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-950">Add Recruiter Note</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Save an internal note about this candidate.
        </p>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={6}
          placeholder="Write your note here..."
          className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-semibold hover:bg-slate-50">
            Cancel
          </button>

          <button onClick={onSave} className="h-11 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700">
            Save Note
          </button>
        </div>
      </div>
    </div>
  )
}

function InterviewPrepModal({
  name,
  candidate,
  matchedSkills,
  missingSkills,
  goodFitReasons,
  badFitReasons,
  onClose,
}: {
  name: string
  candidate: Candidate
  matchedSkills: string[]
  missingSkills: string[]
  goodFitReasons: string[]
  badFitReasons: string[]
  onClose: () => void
}) {
  const role = candidate.roleTitle || "Not specified"
  const score = candidate.score || 0
  const recommendation = candidate.recommendation || "Review Candidate"
const technicalQuestions = generateTechnicalQuestions(candidate, matchedSkills)
  const behaviouralQuestions = [
    "Tell me about a recent project you are proud of. What was your specific contribution?",
    "Describe a time you had to solve a difficult technical problem. How did you approach it?",
    "Tell me about a time you received feedback on your work. What did you do with it?",
    "Describe a time you had to work with unclear or changing requirements.",
  ]

  const downloadPdf = () => {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

const technicalQuestions = generateTechnicalQuestions(candidate, matchedSkills)
  const behaviouralQuestions = [
    "Tell me about a recent project you are proud of. What was your specific contribution?",
    "Describe a time you had to solve a difficult technical problem. How did you approach it?",
    "Tell me about a time you received feedback on your work. What did you do with it?",
    "Describe a time you had to work with unclear or changing requirements.",
  ]

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Interview Prep - ${name}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 40px;
            font-family: Arial, sans-serif;
            color: #0f172a;
            background: white;
            line-height: 1.55;
          }

          .page {
            max-width: 820px;
            margin: 0 auto;
          }

          h1 {
            margin: 0 0 6px;
            color: #6d28d9;
            font-size: 28px;
          }

          h2 {
            margin: 28px 0 12px;
            color: #111827;
            font-size: 18px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            page-break-after: avoid;
          }

          p, li {
            font-size: 13px;
          }

          ul, ol {
            padding-left: 22px;
          }

          li {
            margin-bottom: 8px;
            page-break-inside: avoid;
          }

          .meta {
            margin-top: 18px;
            padding: 16px;
            border: 1px solid #ddd6fe;
            background: #f5f3ff;
            border-radius: 14px;
          }

          .meta p {
            margin: 4px 0;
          }

          .section {
            page-break-inside: avoid;
          }

          .strength {
            color: #047857;
          }

          .risk {
            color: #dc2626;
          }

          @media print {
            body {
              padding: 28px;
            }

            .page {
              max-width: none;
            }

            .section {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="page">
          <h1>Nuviq Interview Preparation Report</h1>
          <p>Generated for recruiter interview preparation.</p>

          <div class="meta">
            <p><strong>Candidate:</strong> ${name}</p>
            <p><strong>Role:</strong> ${role}</p>
            <p><strong>Fit Score:</strong> ${score}%</p>
            <p><strong>Recommendation:</strong> ${recommendation}</p>
            <p><strong>Date Generated:</strong> ${new Date().toLocaleString("en-GB")}</p>
          </div>

          <div class="section">
            <h2>Candidate Snapshot</h2>
            <p><strong>Matched skills:</strong> ${matchedSkills.join(", ") || "No matched skills listed."}</p>
            <p><strong>Areas to probe:</strong> ${missingSkills.join(", ") || "No weak areas listed."}</p>
          </div>

          <div class="section">
            <h2>Strengths to Validate</h2>
            <ul>
              ${(goodFitReasons.length ? goodFitReasons : ["No detailed strengths were generated for this candidate."])
                .map((item) => `<li class="strength">${item}</li>`)
                .join("")}
            </ul>
          </div>

          <div class="section">
            <h2>Risk Areas to Probe</h2>
            <ul>
              ${(badFitReasons.length ? badFitReasons : ["No major concerns were generated for this candidate."])
                .map((item) => `<li class="risk">${item}</li>`)
                .join("")}
            </ul>
          </div>

          <div class="section">
            <h2>Technical Interview Questions</h2>
            <ol>
              ${technicalQuestions.map((item) => `<li>${item}</li>`).join("")}
            </ol>
          </div>

          <div class="section">
            <h2>Behavioural Interview Questions</h2>
            <ol>
              ${behaviouralQuestions.map((item) => `<li>${item}</li>`).join("")}
            </ol>
          </div>

          <div class="section">
            <h2>Suggested Scorecard</h2>
            <ul>
              <li>Technical ability: ____ / 10</li>
              <li>Communication: ____ / 10</li>
              <li>Problem solving: ____ / 10</li>
              <li>Commercial readiness: ____ / 10</li>
              <li>Overall fit: ____ / 10</li>
            </ul>
          </div>
        </div>

        <script>
          window.onload = () => {
            window.print()
          }
        </script>
      </body>
    </html>
  `)

  printWindow.document.close()
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Prepare for Interview</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Detailed interview preparation notes generated for {name}.
            </p>
          </div>

          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">
            Close
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-5">
          <h3 className="font-bold text-violet-700">Candidate Snapshot</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <InfoBox label="Candidate" value={name} />
            <InfoBox label="Role" value={role} />
            <InfoBox label="Fit Score" value={`${score}%`} />
            <InfoBox label="Recommendation" value={recommendation} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <InterviewSection title="Strengths to Validate" variant="positive" items={goodFitReasons} />
          <InterviewSection title="Risk Areas to Probe" variant="risk" items={badFitReasons} />
          <InterviewSection title="Technical Interview Questions" variant="neutral" items={technicalQuestions} ordered />
          <InterviewSection title="Behavioural Interview Questions" variant="neutral" items={behaviouralQuestions} ordered />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-semibold hover:bg-slate-50">
            Cancel
          </button>

          <button onClick={downloadPdf} className="h-11 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700">
            Download as PDF
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  )
}

function InterviewSection({
  title,
  variant,
  items,
  ordered = false,
}: {
  title: string
  variant: "positive" | "risk" | "neutral"
  items: string[]
  ordered?: boolean
}) {
  const color =
    variant === "positive"
      ? "text-emerald-700"
      : variant === "risk"
        ? "text-red-600"
        : "text-violet-700"

  const ListTag = ordered ? "ol" : "ul"

  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h3 className={`font-bold ${color}`}>{title}</h3>
      <ListTag className={`${ordered ? "list-decimal" : "list-disc"} mt-3 space-y-2 pl-5 text-sm font-medium leading-6 text-slate-600`}>
        {(items.length ? items : ["No detailed notes generated."]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </section>
  )
}

function generateTechnicalQuestions(candidate: Candidate, skills: string[]) {
  const role = candidate.roleTitle || "this role"
  const matchedSkills = candidate.matchedSkills || []
  const missingSkills = candidate.missingSkills || []

  const questions: string[] = []

  questions.push(
    `Looking at your experience, what project best demonstrates your ability to succeed in the ${role} position? What was the business problem, your contribution, and the outcome?`
  )

  if (matchedSkills.length) {
    questions.push(
      `Your profile shows strengths in ${matchedSkills
        .slice(0, 4)
        .join(", ")}. Tell me about a situation where you used these skills together to solve a significant business problem.`
    )
  }

  questions.push(
    "Tell me about a process, system, or project that was underperforming when you inherited it. How did you identify the root cause and what measurable improvements resulted?"
  )

  questions.push(
    "Describe a time when multiple high-priority issues occurred simultaneously. How did you prioritise your work and communicate your decisions to stakeholders?"
  )

  questions.push(
    "What KPI, metric, or performance indicator have you personally been responsible for improving? What actions did you take and what was the outcome?"
  )

  if (missingSkills.length) {
    questions.push(
      `The screening identified ${missingSkills
        .slice(0, 3)
        .join(", ")} as potential gaps. Can you tell me about any relevant experience that may not be obvious from your CV?`
    )
  }

  questions.push(
    `If you joined this company tomorrow, what would your first 30 days look like and what would you focus on first?`
  )

  return questions.slice(0, 8)
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function inferYears(experienceHistory: ExperienceItem[]) {
  if (!experienceHistory.length) return "Experience not extracted"
  return `${experienceHistory.length}+ Roles Listed`
}

function formatReasonTitle(reason: string) {
  const words = reason.split(" ").slice(0, 3).join(" ")
  return words || "Candidate Insight"
}