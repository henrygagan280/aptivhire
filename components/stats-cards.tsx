import {
  Users,
  TrendingUp,
  Star,
  ThumbsUp,
  Smile,
  X,
} from "lucide-react"

type Candidate = {
  score?: number
  recommendation?: string
}

type StatsCardsProps = {
  results: Candidate[]
}

function CircleProgress({ value }: { value: number }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative h-16 w-16">
      <svg className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-orange-100"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-orange-500"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
        {value}%
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  circle,
  muted,
}: {
  title: string
  value: string | number
  helper?: string
  icon: any
  circle?: number
  muted?: boolean
}) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            muted ? "bg-slate-100 text-slate-500" : "bg-orange-100 text-orange-600"
          }`}
        >
          <Icon size={18} />
        </div>

        <p className="text-sm font-semibold text-slate-700">{title}</p>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          {helper && (
            <p
              className={`mt-2 text-xs font-medium ${
                muted ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {helper}
            </p>
          )}
        </div>

        {typeof circle === "number" && <CircleProgress value={circle} />}
      </div>
    </div>
  )
}

export default function StatsCards({ results }: StatsCardsProps) {
  const total = results.length

  const average =
    total > 0
      ? Math.round(
          results.reduce((sum, candidate) => sum + (candidate.score || 0), 0) /
            total
        )
      : 0

  const greatMatches = results.filter((c) => (c.score || 0) >= 80).length
  const recommended = results.filter(
    (c) => (c.score || 0) >= 60 && (c.score || 0) < 80
  ).length
  const worthLook = results.filter(
    (c) => (c.score || 0) >= 40 && (c.score || 0) < 60
  ).length
  const notFit = results.filter((c) => (c.score || 0) < 40).length

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <StatCard
        title="Total Candidates"
        value={total}
        helper={total > 0 ? "Analysed just now" : "Ready to analyse"}
        icon={Users}
      />

      <StatCard
        title="Average Fit Score"
        value={`${average}%`}
        helper={total > 0 ? "Across this upload" : "No candidates yet"}
        icon={TrendingUp}
        circle={average}
      />

      <StatCard
        title="Great Matches"
        value={greatMatches}
        helper="80%+ match score"
        icon={Star}
      />

      <StatCard
        title="Recommended"
        value={recommended}
        helper="60% - 79% match"
        icon={ThumbsUp}
      />

      <StatCard
        title="Worth a Look"
        value={worthLook}
        helper="40% - 59% match"
        icon={Smile}
      />

      <StatCard
        title="Not a Fit"
        value={notFit}
        helper="Below 40% match"
        icon={X}
        muted
      />
    </div>
  )
}