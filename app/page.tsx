import Link from "next/link"
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Lock,
  Mail,
} from "lucide-react"

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 0% 0%, rgba(124,58,237,0.32), transparent 32%), radial-gradient(circle at 12% 90%, rgba(124,58,237,0.28), transparent 28%), #03040C",
        color: "white",
        padding: "32px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          position: "relative",
          maxWidth: "1520px",
          minHeight: "900px",
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: "28px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "#050612",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          display: "grid",
          gridTemplateColumns: "680px 1fr",
        }}
      >
        {/* LEFT SIDE */}
        <div
          style={{
            position: "relative",
            padding: "86px 70px",
            borderRight: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            <div
              style={{
                fontSize: "56px",
                fontWeight: 900,
                lineHeight: 1,
                color: "#8B5CF6",
              }}
            >
              A
            </div>

            <div style={{ fontSize: "30px", fontWeight: 900 }}>
              Aptiv<span style={{ color: "#A855F7" }}>Hire</span>
            </div>
          </div>

          <div style={{ marginTop: "90px" }}>
            <h1
              style={{
                fontSize: "58px",
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                fontWeight: 900,
                margin: 0,
              }}
            >
              Welcome back
              <br />
              <span style={{ color: "#8B5CF6" }}>to smarter hiring</span>
            </h1>

            <p
              style={{
                marginTop: "32px",
                maxWidth: "500px",
                color: "#CBD5E1",
                fontSize: "22px",
                lineHeight: 1.55,
              }}
            >
              Sign in to your account and continue building high-performing
              teams.
            </p>

            <div style={{ marginTop: "76px", display: "grid", gap: "38px" }}>
              <Feature
                icon={<CheckSquare size={28} />}
                title="AI-Powered Candidate Analysis"
                text="Instantly analyse and rank candidates"
              />

              <Feature
                icon={<BarChart3 size={28} />}
                title="Smart Recruitment Pipelines"
                text="Manage every stage of your hiring process"
              />

              <Feature
                icon={<CalendarDays size={28} />}
                title="Interview Scheduling"
                text="Schedule interviews and sync your calendar"
              />
            </div>
          </div>

          {/* purple dotted wave */}
          <div
            style={{
              position: "absolute",
              left: "-120px",
              bottom: "-155px",
              width: "820px",
              height: "360px",
              borderRadius: "100%",
              borderTop: "1px solid rgba(168,85,247,0.55)",
              backgroundImage:
                "radial-gradient(circle, rgba(168,85,247,0.8) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              opacity: 0.7,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "80px",
              bottom: "-20px",
              width: "520px",
              height: "130px",
              background: "rgba(124,58,237,0.25)",
              filter: "blur(55px)",
              borderRadius: "999px",
            }}
          />
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "640px",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.12)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))",
              padding: "70px 64px",
              boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "38px",
                  lineHeight: 1.1,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                Sign in to your account
              </h2>

              <p
                style={{
                  marginTop: "18px",
                  color: "#94A3B8",
                  fontSize: "18px",
                }}
              >
                Enter your details to access your workspace
              </p>
            </div>

            <div style={{ marginTop: "54px", display: "grid", gap: "30px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "12px",
                    fontSize: "15px",
                    fontWeight: 800,
                  }}
                >
                  Email address
                </label>

                <div style={inputBoxStyle}>
                  <Mail size={21} color="#64748B" />
                  <input
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <label style={{ fontSize: "15px", fontWeight: 800 }}>
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    style={{
                      color: "#A855F7",
                      fontSize: "15px",
                      fontWeight: 800,
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>

                <div style={inputBoxStyle}>
                  <Lock size={21} color="#64748B" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                </div>
              </div>

              <Link
  href="/login"
  style={{
    height: "58px",
    borderRadius: "10px",
    border: "none",
    background:
      "linear-gradient(90deg, #8B5CF6 0%, #9333EA 55%, #7E22CE 100%)",
    color: "white",
    fontSize: "17px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 18px 36px rgba(124,58,237,0.32)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  }}
>
  Sign in
</Link>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  color: "#94A3B8",
                  fontSize: "15px",
                }}
              >
                <div style={lineStyle} />
                <span>or continue with</span>
                <div style={lineStyle} />
              </div>

              <Link
  href="/login"
  style={{
    height: "58px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: "17px",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  }}
>
  <span style={{ marginRight: "14px", fontWeight: 900 }}>G</span>
  Continue with Google
</Link>

              <p style={{ textAlign: "center", fontSize: "16px", margin: 0 }}>
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  style={{
                    color: "#A855F7",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            position: "absolute",
            left: "28px",
            bottom: "28px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "42px", fontWeight: 900, color: "#8B5CF6" }}>
            A
          </div>
          <div style={{ fontSize: "26px", fontWeight: 900 }}>
            Aptiv<span style={{ color: "#A855F7" }}>Hire</span>
          </div>
        </div>

        <p
          style={{
            position: "absolute",
            bottom: "39px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#64748B",
            fontSize: "14px",
            margin: 0,
          }}
        >
          © 2026 Nuviq. All rights reserved.
        </p>

        <div
          style={{
            position: "absolute",
            right: "48px",
            bottom: "39px",
            display: "flex",
            gap: "42px",
            fontSize: "14px",
          }}
        >
          <Link href="/privacy" style={footerLinkStyle}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={footerLinkStyle}>
            Terms of Service
          </Link>
        </div>
      </section>
    </main>
  )
}

const inputBoxStyle: React.CSSProperties = {
  height: "58px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "#050611",
  padding: "0 18px",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "white",
  fontSize: "17px",
}

const lineStyle: React.CSSProperties = {
  height: "1px",
  flex: 1,
  background: "rgba(255,255,255,0.1)",
}

const footerLinkStyle: React.CSSProperties = {
  color: "#64748B",
  textDecoration: "none",
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      <div
        style={{
          width: "70px",
          height: "70px",
          borderRadius: "999px",
          border: "1px solid rgba(168,85,247,0.28)",
          background: "rgba(124,58,237,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#A855F7",
          boxShadow: "0 18px 40px rgba(88,28,135,0.35)",
        }}
      >
        {icon}
      </div>

      <div>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 800,
            margin: 0,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: "8px 0 0",
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          {text}
        </p>
      </div>
    </div>
  )
}