"use client"

import { FormEvent, ReactNode, Suspense, useState, type CSSProperties } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { BarChart3, CalendarDays, CheckSquare, Lock, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/browser"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const removed = searchParams.get("removed")
  const inviteToken = searchParams.get("invite_token")
  const redirectTo =
    searchParams.get("redirectTo") ||
    (inviteToken ? `/invite/accept?token=${inviteToken}` : "/dashboard")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage("")

    const supabase = createClient()

    await supabase.auth.signOut()

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setLoading(false)
      setErrorMessage("Invalid email or password.")
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      setErrorMessage("Login failed. Please try again.")
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.email?.toLowerCase() !== email.trim().toLowerCase()) {
      await supabase.auth.signOut()
      setLoading(false)
      setErrorMessage("Login session mismatch. Please try again.")
      return
    }

    try {
      const { data: membership, error: membershipError } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (membershipError || !membership) {
        await supabase.auth.signOut()
        setErrorMessage("Incorrect email or password.")
        return
      }
    } catch (error) {
      console.error("Membership check failed:", error)
      await supabase.auth.signOut()
      setErrorMessage("Incorrect email or password.")
      return
    } finally {
      setLoading(false)
    }

    localStorage.removeItem("aptivhire-results")
    localStorage.removeItem("aptivhire-pipeline")
    localStorage.removeItem("aptivhire-activity")

    router.replace(redirectTo)
    router.refresh()
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={brandPanelStyle}>
          <div style={logoRowStyle}>
            <div style={logoMarkStyle}>N</div>
            <div>
              <div style={brandNameStyle}>Nuviq</div>
              <div style={brandSubStyle}>Recruitment intelligence</div>
            </div>
          </div>

          <div style={heroStyle}>
            <div style={pillStyle}>Welcome back</div>

            <h1 style={heroTitleStyle}>Your hiring workspace, ready when you are.</h1>

            <p style={heroTextStyle}>
              Sign in to review candidates, manage pipelines, schedule interviews, and keep your hiring process moving.
            </p>

            <div style={featureListStyle}>
              <Feature
                icon={<CheckSquare size={18} />}
                title="Candidate analysis"
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
        </div>

        <div style={formPanelStyle}>
          <form onSubmit={handleLogin} style={formStyle}>
            <div>
              <h2 style={formTitleStyle}>Sign in</h2>
              <p style={formTextStyle}>Enter your details to access your Nuviq workspace.</p>
            </div>

            <div style={fieldsStyle}>
              <div>
                <label style={labelStyle}>Email address</label>
                <div style={inputBoxStyle}>
                  <Mail size={17} color="#475569" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={inputBoxStyle}>
                  <Lock size={17} color="#475569" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                </div>
              </div>

              {removed && <p style={alertStyle}>Your access to this workspace has been removed.</p>}

              {errorMessage && <p style={alertStyle}>{errorMessage}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...signInButtonStyle,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <p style={signupTextStyle}>
                Don&apos;t have an account?{" "}
                <Link href="/signup" style={signupLinkStyle}>
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px",
  color: "#0F172A",
  fontFamily: "Inter, system-ui, sans-serif",
  background:
    "radial-gradient(circle at top left, rgba(99,102,241,0.10), transparent 30%), radial-gradient(circle at bottom right, rgba(15,23,42,0.08), transparent 28%), linear-gradient(135deg, #F8FAFC 0%, #EEF2F7 100%)",
}

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1120px",
  minHeight: "700px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 0.92fr",
  overflow: "hidden",
  borderRadius: "28px",
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 30px 80px rgba(15,23,42,0.14)",
}

const brandPanelStyle: CSSProperties = {
  position: "relative",
  padding: "48px",
  borderRight: "1px solid rgba(148,163,184,0.26)",
  background:
    "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 45%, #EEF2F7 100%)",
}

const logoRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
}

const logoMarkStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #111827, #334155)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 900,
  boxShadow: "0 16px 34px rgba(15,23,42,0.18)",
}

const brandNameStyle: CSSProperties = {
  fontSize: "22px",
  fontWeight: 900,
  letterSpacing: "-0.03em",
  color: "#0F172A",
}

const brandSubStyle: CSSProperties = {
  marginTop: "2px",
  color: "#64748B",
  fontSize: "12px",
  fontWeight: 650,
}

const heroStyle: CSSProperties = {
  marginTop: "92px",
  maxWidth: "500px",
}

const pillStyle: CSSProperties = {
  width: "fit-content",
  borderRadius: "999px",
  border: "1px solid rgba(148,163,184,0.45)",
  background: "#FFFFFF",
  color: "#334155",
  padding: "7px 12px",
  fontSize: "12px",
  fontWeight: 800,
  boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
}

const heroTitleStyle: CSSProperties = {
  margin: "22px 0 0",
  fontSize: "44px",
  lineHeight: 1.04,
  letterSpacing: "-0.055em",
  fontWeight: 950,
  color: "#0F172A",
}

const heroTextStyle: CSSProperties = {
  margin: "22px 0 0",
  maxWidth: "430px",
  color: "#475569",
  fontSize: "15px",
  lineHeight: 1.75,
}

const featureListStyle: CSSProperties = {
  marginTop: "46px",
  display: "grid",
  gap: "16px",
}

const formPanelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px",
  background:
    "linear-gradient(180deg, rgba(248,250,252,0.88), rgba(255,255,255,0.96))",
}

const formStyle: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  borderRadius: "24px",
  border: "1px solid rgba(148,163,184,0.36)",
  background: "#FFFFFF",
  padding: "38px",
  boxShadow: "0 22px 60px rgba(15,23,42,0.10)",
}

const formTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "30px",
  lineHeight: 1.1,
  letterSpacing: "-0.045em",
  fontWeight: 950,
  color: "#0F172A",
}

const formTextStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#64748B",
  fontSize: "13px",
  lineHeight: 1.6,
}

const fieldsStyle: CSSProperties = {
  marginTop: "30px",
  display: "grid",
  gap: "20px",
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 850,
}

const inputBoxStyle: CSSProperties = {
  height: "48px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  borderRadius: "14px",
  border: "1px solid rgba(148,163,184,0.45)",
  background: "#F8FAFC",
  padding: "0 14px",
}

const inputStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#0F172A",
  fontSize: "14px",
}

const alertStyle: CSSProperties = {
  margin: 0,
  borderRadius: "12px",
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#B91C1C",
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 750,
  lineHeight: 1.5,
}

const signInButtonStyle: CSSProperties = {
  height: "48px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #111827, #334155)",
  color: "white",
  fontSize: "14px",
  fontWeight: 900,
  boxShadow: "0 18px 34px rgba(15,23,42,0.18)",
}

const signupTextStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "#64748B",
  fontSize: "13px",
}

const signupLinkStyle: CSSProperties = {
  color: "#111827",
  fontWeight: 900,
  textDecoration: "none",
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
    <div style={featureStyle}>
      <div style={featureIconStyle}>{icon}</div>
      <div>
        <h3 style={featureTitleStyle}>{title}</h3>
        <p style={featureTextStyle}>{text}</p>
      </div>
    </div>
  )
}

const featureStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
}

const featureIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  flex: "0 0 auto",
  borderRadius: "14px",
  border: "1px solid rgba(148,163,184,0.36)",
  background: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#334155",
  boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
}

const featureTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 850,
  color: "#0F172A",
}

const featureTextStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#64748B",
  fontSize: "12px",
  lineHeight: 1.5,
}
