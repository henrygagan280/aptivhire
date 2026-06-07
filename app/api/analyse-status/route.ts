import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const total = globalThis.analysisProgress?.total || 0
  const completed = globalThis.analysisProgress?.completed || 0

  return NextResponse.json({
    total,
    completed: Math.min(completed, total),
  })
}