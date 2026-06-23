"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/browser"

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitePageContent />
    </Suspense>
  )
}

function AcceptInvitePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const signOutAndLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/signup?invite_token=${token}`)
  }

  const acceptInvite = async () => {
    if (!token) {
      setError("Invalid invite link.")
      return
    }

    setLoading(true)
    setError("")
    window.location.href = `/api/team/invites/accept?token=${token}`
  }

  if (!token) {
    return <div>Invalid invite link.</div>
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700">
          Team invitation
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Join this Nuviq team
        </h1>

        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
          To accept this invite, you must be signed in with the same email
          address that was invited.
        </p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            onClick={signOutAndLogin}
            className="h-12 w-full rounded-2xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"
          >
            Create account or sign in first
          </button>

          <button
            onClick={acceptInvite}
            disabled={loading}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Accepting..." : "I am signed in — accept invite"}
          </button>
        </div>

        <p className="mt-4 text-xs font-medium leading-5 text-slate-500">
          Already signed in as the invited user? Choose the second button. Not
          signed in yet, or signed in as the wrong account? Choose the first
          button.
        </p>
      </div>
    </main>
  )
}