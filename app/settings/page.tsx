"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Bell,
  Briefcase,
  Building2,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  CreditCard,
  Languages,
} from "lucide-react"
import { createClient } from "@/lib/supabase/browser"

type AccountSettings = {
  fullName: string
  email: string
  company: string
  role: string
  defaultSenderEmail: string
  notificationsEnabled: boolean
}

const defaultSettings: AccountSettings = {
  fullName: "James Smith",
  email: "james@aptivhire.com",
  company: "AptivHire",
  role: "Recruiter",
  defaultSenderEmail: "recruiter@aptivhire.net",
  notificationsEnabled: true,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AccountSettings>(defaultSettings)
  const [savedMessage, setSavedMessage] = useState("")

  useEffect(() => {
  const loadSettings = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, email, company, role, default_sender_email, notifications_enabled"
      )
      .eq("id", user.id)
      .single()

    setSettings({
      fullName: profile?.full_name || "",
      email: profile?.email || user.email || "",
      company: profile?.company || "",
      role: profile?.role || "Recruiter",
      defaultSenderEmail: profile?.default_sender_email || user.email || "",
      notificationsEnabled: profile?.notifications_enabled ?? true,
    })
  }

  loadSettings()
}, [])

  const updateSetting = <K extends keyof AccountSettings>(
    key: K,
    value: AccountSettings[K]
  ) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const saveSettings = async () => {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: settings.fullName,
      email: settings.email,
      company: settings.company,
      role: settings.role,
      default_sender_email: settings.defaultSenderEmail,
      notifications_enabled: settings.notificationsEnabled,
    })
    .eq("id", user.id)

  if (error) {
    console.error(error)
    setSavedMessage("Could not save settings.")
    return
  }

  setSavedMessage("Settings saved successfully.")

  window.setTimeout(() => {
    setSavedMessage("")
  }, 2500)
}

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 space-y-6 px-8 py-7">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
                Account
              </p>
              <h1 className="mt-2 text-[34px] font-bold tracking-tight text-slate-950">
                Settings
              </h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">
                Manage your profile, company details, email preferences,
                integrations and subscription settings.
              </p>
            </div>

            <button
              onClick={saveSettings}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
            >
              <Save size={17} />
              Save Changes
            </button>
          </header>

          {savedMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
              {savedMessage}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <SectionTitle
                icon={<User />}
                title="Account Details"
                description="Update the profile information shown across AptivHire."
              />

              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full name">
                    <Input
                      value={settings.fullName}
                      onChange={(e) =>
                        updateSetting("fullName", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Email address">
                    <Input
                      value={settings.email}
                      onChange={(e) => updateSetting("email", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Company">
                    <Input
                      value={settings.company}
                      onChange={(e) =>
                        updateSetting("company", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Role">
                    <Input
                      value={settings.role}
                      onChange={(e) => updateSetting("role", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <SectionTitle
                icon={<ShieldCheck />}
                title="Plan Overview"
                description="Your current AptivHire subscription."
              />

              <div className="p-6">
                <div className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
                      <Sparkles />
                    </div>

                    <div>
                      <p className="text-lg font-bold text-slate-950">
                        Pro Plan
                      </p>
                      <p className="text-sm font-medium text-slate-500">
                        Team Plan
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm">
                    <PlanRow label="Renewal date" value="May 20, 2025" />
                    <PlanRow label="Seats" value="1 recruiter" />
                    <PlanRow label="Usage" value="Unlimited analysis" />
                  </div>

                  <Link
  href="/subscription"
  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
>
  <CreditCard size={17} />
  Manage Subscription
</Link>
                </div>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={<Mail />}
              title="Email Settings"
              description="Set the default sender used in candidate emails."
            />

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <Field label="Default sender email">
                <Input
                  value={settings.defaultSenderEmail}
                  onChange={(e) =>
                    updateSetting("defaultSenderEmail", e.target.value)
                  }
                />
              </Field>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-sm font-bold text-slate-950">
                  Current sender
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                  Candidate emails will appear to come from{" "}
                  <span className="font-bold text-violet-700">
                    {settings.defaultSenderEmail}
                  </span>
                  .
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={<Briefcase />}
              title="Job Board Integrations"
              description="Connect job boards so roles can be imported into your Jobs library."
            />

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <ComingSoonCard
                title="Indeed"
                description="Import active jobs from your Indeed employer account."
              />

              <ComingSoonCard
                title="Totaljobs"
                description="Import live roles from your Totaljobs recruiter account."
              />
            </div>

            <div className="mx-6 mb-6 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-medium leading-6 text-violet-800">
              Job board integrations are coming soon. For now, add jobs
              manually in the Jobs page and they will appear in your saved job
              dropdown when analysing candidates.
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={<Bell />}
              title="Notifications"
              description="Control updates about candidate activity and pipeline changes."
            />

            <div className="p-6">
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-200 hover:bg-violet-50/40">
                <div>
                  <p className="font-bold text-slate-950">
                    Candidate activity notifications
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    Receive updates when candidates are moved, contacted or
                    marked as replied.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) =>
                    updateSetting("notificationsEnabled", e.target.checked)
                  }
                  className="h-5 w-5 accent-violet-600"
                />
              </label>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  )
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-r from-white via-violet-50/40 to-white px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="text-sm font-medium text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
    />
  )
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-slate-950">{value}</span>
    </div>
  )
}

function ComingSoonCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>

          <span className="mt-4 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
            Coming soon
          </span>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Building2 size={20} />
        </div>
      </div>
    </div>
  )
}