import { Eye, Medal, Trophy } from "lucide-react"
import Link from "next/link"

type Candidate = {
  rank?: number
  candidateName?: string
  name?: string
  email?: string
  score?: number
  recommendation?: string
  matchedSkills?: string[]
  summary?: string
  candidateKey?: string
}

function getName(candidate: Candidate) {
  return candidate.candidateName || candidate.name || "Unnamed Candidate"
}

function formatScore(score?: number) {
  return Number(score || 0).toFixed(1)
}

function CandidatePodiumCard({
  candidate,
  place,
}: {
  candidate: Candidate
  place: 1 | 2 | 3
}) {
  const name = getName(candidate)

  const styles = {
    1: {
      card:
        "order-1 lg:order-2 lg:-mt-10 min-h-[520px] scale-[1.06] border-amber-300 bg-gradient-to-b from-amber-50 via-white to-violet-50 shadow-2xl shadow-amber-100",
      medal:
        "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-950 shadow-lg shadow-amber-200",
      avatar: "h-20 w-20 text-lg from-violet-500 via-purple-500 to-amber-300",
      chip: "bg-amber-50 text-amber-700",
      button: "bg-violet-600 hover:bg-violet-700 shadow-violet-200",
      podium: "from-amber-100 via-yellow-50 to-amber-100 text-amber-600",
      label: "Top Match",
      footer: "#1 Top Match",
      icon: <Trophy size={22} />,
    },
    2: {
      card:
        "order-2 lg:order-1 lg:mb-8 min-h-[455px] scale-[0.96] border-slate-200 bg-gradient-to-b from-slate-50 via-white to-white shadow-sm",
      medal:
        "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-800 shadow-md",
      avatar: "h-16 w-16 text-base from-slate-400 via-violet-400 to-slate-200",
      chip: "bg-slate-100 text-slate-600",
      button: "bg-violet-600 hover:bg-violet-700 shadow-violet-200",
      podium: "from-slate-100 via-white to-slate-100 text-slate-500",
      label: "Strong Runner-Up",
      footer: "#2 Runner-Up",
      icon: <Medal size={21} />,
    },
    3: {
      card:
        "order-3 lg:mb-4 min-h-[455px] scale-[0.96] border-orange-200 bg-gradient-to-b from-orange-50 via-white to-white shadow-sm",
      medal:
        "bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600 text-orange-950 shadow-md",
      avatar: "h-16 w-16 text-base from-orange-400 via-violet-500 to-purple-600",
      chip: "bg-orange-50 text-orange-700",
      button: "bg-violet-600 hover:bg-violet-700 shadow-violet-200",
      podium: "from-orange-100 via-white to-orange-100 text-orange-600",
      label: "Shortlist Pick",
      footer: "#3 Shortlist Pick",
      icon: <Medal size={21} />,
    },
  }[place]

  return (
    <div
      className={`relative rounded-[28px] border p-6 text-center transition ${styles.card}`}
    >
      <div
        className={`absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl ${styles.medal}`}
      >
        {styles.icon}
      </div>

      <div
        className={`mx-auto mt-6 flex items-center justify-center rounded-full bg-gradient-to-br font-black text-white shadow-md ${styles.avatar}`}
      >
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)}
      </div>

      <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
        {name}
      </h3>

      <p className="mt-1 text-sm font-bold text-violet-700">
        {formatScore(candidate.score)}% Match
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-500">
        {styles.label}
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(candidate.matchedSkills || []).slice(0, 3).map((skill) => (
          <span
            key={skill}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.chip}`}
          >
            {skill}
          </span>
        ))}
      </div>

      <p className="mx-auto mt-4 max-w-sm line-clamp-2 text-sm font-medium leading-6 text-slate-500">
        {candidate.summary ||
          "A strong candidate worth reviewing for this role."}
      </p>

      <div className="mt-5 flex justify-center">
        <Link
  href={{
    pathname: `/candidates/${candidate.candidateKey || candidate.rank || place}`,
    query: {
      rank: candidate.rank || place,
    },
  }}
  className={`inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white shadow-sm transition ${styles.button}`}
>
  <Eye size={15} />
  View Profile
</Link>
      </div>

      <div className="mt-6 px-4">
        <div
          className={`flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r ${styles.podium}`}
        >
          <span className="text-sm font-black">
            {styles.footer}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function TopCandidatesPodium({
  results,
}: {
  results: Candidate[]
}) {
  const topThree = [...results]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 3)

  if (topThree.length === 0) return null

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Leading Candidates
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Top ranked applicants based on AI scoring and role fit.
          </p>
        </div>

        <a
          href="#all-candidates"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
        >
          View All Candidates
        </a>
      </div>

      <div className="grid items-end gap-7 lg:grid-cols-[0.95fr_1.15fr_0.95fr]">
        {topThree[1] && (
          <CandidatePodiumCard candidate={topThree[1]} place={2} />
        )}

        {topThree[0] && (
          <CandidatePodiumCard candidate={topThree[0]} place={1} />
        )}

        {topThree[2] && (
          <CandidatePodiumCard candidate={topThree[2]} place={3} />
        )}
      </div>
    </section>
  )
}