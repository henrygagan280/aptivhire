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

            <h1 style={heroTitleStyle}>
              Sign in and keep your hiring moving.
            </h1>

            <p style={heroTextStyle}>
              Access your workspace, review candidates, manage pipelines, and schedule interviews from one place.
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
              <p style={formTextStyle}>
                Enter your details to access your Nuviq workspace.
              </p>
            </div>

            <div style={fieldsStyle}>
              <div>
                <label style={labelStyle}>Email address</label>
                <div style={inputBoxStyle}>
                  <Mail size={17} color="#8B5CF6" />
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
                  <Lock size={17} color="#8B5CF6" />
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

              {removed && (
                <p style={alertStyle}>
                  Your access to this workspace has been removed.
                </p>
              )}

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
  color: "#FFFFFF",
  fontFamily: "Inter, system-ui, sans-serif",
  background:
    "radial-gradient(circle at top left, rgba(139,92,246,0.34), transparent 34%), radial-gradient(circle at bottom right, rgba(168,85,247,0.18), transparent 30%), #03040B",
}

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1180px",
  minHeight: "720px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 0.95fr",
  overflow: "hidden",
  borderRadius: "28px",
  border: "1px solid rgba(255,255,255,0.11)",
  background: "rgba(5,6,18,0.92)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.55)",
}

const brandPanelStyle: CSSProperties = {
  position: "relative",
  padding: "48px",
  borderRight: "1px solid rgba(255,255,255,0.09)",
  background:
    "linear-gradient(145deg, rgba(124,58,237,0.16), rgba(255,255,255,0.02) 45%, rgba(5,6,18,0.5))",
}

const logoRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
}

const logoMarkStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #8B5CF6, #A855F7)",
  fontSize: "17px",
  fontWeight: 900,
  boxShadow: "0 16px 34px rgba(139,92,246,0.32)",
}

const brandNameStyle: CSSProperties = {
  fontSize: "21px",
  fontWeight: 900,
  letterSpacing: "-0.03em",
}

const brandSubStyle: CSSProperties = {
  marginTop: "2px",
  color: "#94A3B8",
  fontSize: "12px",
  fontWeight: 600,
}

const heroStyle: CSSProperties = {
  marginTop: "86px",
  maxWidth: "520px",
}

const pillStyle: CSSProperties = {
  width: "fit-content",
  borderRadius: "999px",
  border: "1px solid rgba(168,85,247,0.28)",
  background: "rgba(124,58,237,0.16)",
  color: "#C4B5FD",
  padding: "7px 12px",
  fontSize: "12px",
  fontWeight: 800,
}

const heroTitleStyle: CSSProperties = {
  margin: "22px 0 0",
  fontSize: "44px",
  lineHeight: 1.04,
  letterSpacing: "-0.055em",
  fontWeight: 950,
}

const heroTextStyle: CSSProperties = {
  margin: "22px 0 0",
  maxWidth: "440px",
  color: "#CBD5E1",
  fontSize: "15px",
  lineHeight: 1.7,
}

const featureListStyle: CSSProperties = {
  marginTop: "48px",
  display: "grid",
  gap: "18px",
}

const formPanelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px",
}

const formStyle: CSSProperties = {
  width: "100%",
  maxWidth: "430px",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
  padding: "38px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
}

const formTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
  fontWeight: 950,
}

const formTextStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#94A3B8",
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
  color: "#E2E8F0",
  fontSize: "12px",
  fontWeight: 800,
}

const inputBoxStyle: CSSProperties = {
  height: "48px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(3,4,12,0.72)",
  padding: "0 14px",
}

const inputStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "white",
  fontSize: "14px",
}

const alertStyle: CSSProperties = {
  margin: 0,
  color: "#FCA5A5",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.5,
}

const signInButtonStyle: CSSProperties = {
  height: "48px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(90deg, #8B5CF6 0%, #9333EA 55%, #7E22CE 100%)",
  color: "white",
  fontSize: "14px",
  fontWeight: 900,
  boxShadow: "0 18px 36px rgba(124,58,237,0.32)",
}

const signupTextStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "#94A3B8",
  fontSize: "13px",
}

const signupLinkStyle: CSSProperties = {
  color: "#C084FC",
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
  border: "1px solid rgba(168,85,247,0.26)",
  background: "rgba(124,58,237,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#C084FC",
}

const featureTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 850,
}

const featureTextStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#94A3B8",
  fontSize: "12px",
  lineHeight: 1.5,
}