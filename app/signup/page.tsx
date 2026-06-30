"use client"

import { FormEvent, ReactNode, Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Lock,
  Mail,
  User,
} from "lucide-react"
import { createClient } from "@/lib/supabase/browser"

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  )
}

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite_token")

  const [fullName, setFullName] = useState("")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage("")
    setNotice("")

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company,
        },
      },
    })

    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    if (inviteToken) {
      setNotice("Account created. Please sign in to accept your invite.")

      setTimeout(() => {
        router.push(`/login?invite_token=${inviteToken}`)
      }, 1000)

      return
    }

    setNotice("Account created. Choose a plan to continue.")

    setTimeout(() => {
      router.push("/subscription")
    }, 1000)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-black px-6 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,0.24),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.10),transparent_28%),linear-gradient(135deg,#050505_0%,#12071f_45%,#000_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:grid-cols-[1fr_0.9fr]">
          <section className="hidden border-r border-white/10 bg-black/35 p-10 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-black">
                N
              </div>
              <div>
                <p className="text-2xl font-black tracking-[-0.04em]">
                  Nuviq
                </p>
                <p className="text-xs font-semibold text-white/55">
                  AI recruitment software
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-lg">
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                Create your workspace
              </p>

              <h1 className="text-6xl font-black leading-[0.95] tracking-[-0.07em] text-[#F1FFE8]">
                Start hiring smarter.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-white/70">
                Create your account to analyse candidates, manage pipelines,
                schedule interviews and choose the right plan for your team.
              </p>

              <div className="mt-12 space-y-5">
                <Feature
                  icon={<CheckCircle2 size={18} />}
                  title="AI candidate analysis"
                  text="Review and rank applicants faster."
                />
                <Feature
                  icon={<BarChart3 size={18} />}
                  title="Hiring pipelines"
                  text="Track every candidate clearly."
                />
                <Feature
                  icon={<CalendarDays size={18} />}
                  title="Interview scheduling"
                  text="Sync calendars and create meetings."
                />
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md rounded-[28px] border border-white/12 bg-white/[0.06] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/50">
                  Get started
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] text-white">
                  Create account
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  Set up your Nuviq account and continue to plan selection.
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <InputField
                  label="Full name"
                  icon={<User size={17} />}
                  value={fullName}
                  onChange={setFullName}
                  required
                />

                <InputField
                  label="Company"
                  icon={<Building2 size={17} />}
                  value={company}
                  onChange={setCompany}
                />

                <InputField
                  label="Email"
                  type="email"
                  icon={<Mail size={17} />}
                  value={email}
                  onChange={setEmail}
                  required
                />

                <InputField
                  label="Password"
                  type="password"
                  icon={<Lock size={17} />}
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={6}
                />

                {errorMessage && (
                  <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                    {errorMessage}
                  </p>
                )}

                {notice && (
                  <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-black shadow-[0_18px_40px_rgba(255,255,255,0.12)] transition hover:bg-[#F1FFE8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/55">
                Already have an account?{" "}
                <Link href="/login" className="font-black text-white">
                  Log in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function InputField({
  label,
  icon,
  value,
  onChange,
  type = "text",
  required = false,
  minLength,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  minLength?: number
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/80">
        {label}
      </span>

      <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/12 bg-black/35 px-4 transition focus-within:border-white/40 focus-within:bg-black/50 focus-within:ring-4 focus-within:ring-white/5">
        <span className="text-white/45">{icon}</span>

        <input
          type={type}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full border-none bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/35"
        />
      </div>
    </label>
  )
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-[#F1FFE8]">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black text-white">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-white/50">{text}</p>
      </div>
    </div>
  )
}