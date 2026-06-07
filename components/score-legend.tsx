import { Card } from "@/components/ui/card"

export function ScoreLegend() {
  return (
    <Card className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-2">About the Scores</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Fit Scores are calculated using AI analysis of each candidate&apos;s CV against the job description and requirements.
      </p>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">80 - 100</span>
          <span className="text-xs text-muted-foreground/70">High Fit (Strong Interview)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <span className="text-sm text-muted-foreground">65 - 79</span>
          <span className="text-xs text-muted-foreground/70">Good Fit (Interview)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="text-sm text-muted-foreground">50 - 64</span>
          <span className="text-xs text-muted-foreground/70">Average Fit (Review)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="text-sm text-muted-foreground">0 - 49</span>
          <span className="text-xs text-muted-foreground/70">Low Fit (Reject)</span>
        </div>
      </div>
    </Card>
  )
}
