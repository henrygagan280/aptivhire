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
  const [team, setTeam] = useState<any>(null)
const [members, setMembers] = useState<any[]>([])
const [invites, setInvites] = useState<any[]>([])
const [inviteEmail, setInviteEmail] = useState("")
const [inviteLink, setInviteLink] = useState("")
const [memberToRemove, setMemberToRemove] = useState<any>(null)
const [showRemoveModal, setShowRemoveModal] = useState(false)

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

      const { data: membership } = await supabase
  .from("team_members")
  .select("team_id")
  .eq("user_id", user.id)
  .maybeSingle()

if (membership) {
  const { data: teamData } = await supabase
    .from("teams")
    .select("*")
    .eq("id", membership.team_id)
    .single()

  const { data: memberData } = await supabase
    .from("team_members_with_emails")
    .select("*")
    .eq("team_id", membership.team_id)

  const { data: inviteData } = await supabase
    .from("team_invites")
    .select("*")
    .eq("team_id", membership.team_id)
    .eq("status", "pending")

  setTeam(teamData)
  setMembers(memberData || [])
  setInvites(inviteData || [])
  console.log("MEMBERS:", memberData)
console.log("INVITES:", inviteData)
}

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

  const currentMember = members.find(
  (member) => member.email === settings.email
)

const isTeamOwner = currentMember?.role === "owner"

const activeMemberEmails = new Set(
  members.map((member) => member.email?.toLowerCase())
)

const visibleInvites = invites.filter(
  (invite) => !activeMemberEmails.has(invite.email?.toLowerCase())
)

  const inviteUser = async () => {
  if (!isTeamOwner) {
    setSavedMessage("Only the team admin can invite users.")
    return
  }

  if (team?.plan === "solo") {
    setSavedMessage("Solo plans only include 1 account.")
    return
  }

  if (!team || !inviteEmail.trim()) return

  const seatLimit =
    team.plan === "agency" ? 999999 : team.plan === "team" ? 5 : 1

  const usedSeats = members.length + visibleInvites.length

  if (usedSeats >= seatLimit) {
    setSavedMessage("You have reached your plan seat limit.")
    return
  }

  const supabase = createClient()

  const token = crypto.randomUUID()

  const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) return

const expiresAt = new Date()
expiresAt.setDate(expiresAt.getDate() + 7)

const { error } = await supabase.from("team_invites").insert({
  team_id: team.id,
  email: inviteEmail.trim(),
  token,
  status: "pending",
  invited_by: user.id,
})

  if (error) {
    console.error(error)
    setSavedMessage("Could not create invite link.")
    return
  }

  const link = `${window.location.origin}/invite/accept?token=${token}`

  setInviteLink(link)
  setInviteEmail("")
  setSavedMessage("Invite link created. Copy and share it manually.")

  const { data: updatedInvites } = await supabase
    .from("team_invites")
    .select("*")
    .eq("team_id", team.id)
    .eq("status", "pending")

  setInvites(updatedInvites || [])

  window.dispatchEvent(new Event("usage-updated"))

  window.setTimeout(() => {
    setSavedMessage("")
  }, 4000)
}

const removeMember = async (member: any) => {
  if (!isTeamOwner) return

  if (member.role === "owner") {
    setSavedMessage("You cannot remove the team owner.")
    return
  }

  setMemberToRemove(member)
setShowRemoveModal(true)
}

const confirmRemoveMember = async () => {
  if (!memberToRemove || !team) return

  const supabase = createClient()
  const removedEmail = memberToRemove.email?.trim().toLowerCase()

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", team.id)
    .eq("user_id", memberToRemove.user_id)

  if (error) {
    console.error(error)
    setSavedMessage("Could not remove team member.")
    return
  }

  await supabase
    .from("team_invites")
    .delete()
    .eq("team_id", team.id)
    .ilike("email", removedEmail)
    .eq("status", "pending")

  const { data: updatedMembers } = await supabase
  .from("team_members_with_emails")
  .select("*")
  .eq("team_id", team.id)

const { data: updatedInvites } = await supabase
  .from("team_invites")
  .select("*")
  .eq("team_id", team.id)
  .eq("status", "pending")

setMembers(updatedMembers || [])
setInvites(updatedInvites || [])

  setSavedMessage("Team member removed.")
  setShowRemoveModal(false)
  setMemberToRemove(null)

  window.dispatchEvent(new Event("usage-updated"))
}

const openBillingPortal = async () => {
  try {
    const response = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
    })

    const text = await response.text()

    if (!response.ok) {
      setSavedMessage("No active subscription found.")
      return
    }

    const data = JSON.parse(text)

    window.location.href = data.url
  } catch (error) {
    console.error(error)
    setSavedMessage("Could not open billing portal.")
  }
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
                description="Update the profile information shown across Nuviq."
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
                description="Your current Nuviq subscription."
              />

              <div className="p-6">
                <div className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
                      <Sparkles />
                    </div>

                    <div>
                      <p className="text-lg font-bold text-slate-950">
  {team?.subscription_status === "active" && team?.plan
  ? `${team.plan.charAt(0).toUpperCase()}${team.plan.slice(1)} Plan`
  : "No Plan"}
</p>

<p className="text-sm font-medium text-slate-500">
  Status: {team?.subscription_status || "inactive"}
</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm">
  <PlanRow
    label="Plan"
    value={
  team?.subscription_status === "active" && team?.plan
    ? team.plan
    : "No plan selected"
}
  />

  <PlanRow
    label="Status"
    value={team?.subscription_status || "inactive"}
  />

  <PlanRow
    label="Seats"
    value={
      team?.plan === "agency"
        ? `${members.length} / Unlimited`
        : `${members.length} / ${team?.seat_limit || 1}`
    }
  />
</div>

                  {team?.stripe_customer_id &&
 team?.subscription_status === "active" ? (
  <button
    onClick={openBillingPortal}
    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
  >
    <CreditCard size={17} />
    Manage / Cancel Subscription
  </button>
) : (
  <Link
    href="/pricing"
    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
  >
    <CreditCard size={17} />
    Choose a Plan
  </Link>
)}
                </div>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
  <SectionTitle
    icon={<User />}
    title="Team Members"
    description="Manage users under your company account."
  />

  <div className="space-y-5 p-6">
    {team && (
  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
    {team.subscription_status === "active" ||
    team.subscription_status === "trialing" ? (
      <>
        <p className="text-sm font-bold text-violet-900">
          Plan: {team.plan}
        </p>

        <p className="mt-1 text-sm font-medium text-violet-700">
          Seats used: {members.length + visibleInvites.length} /{" "}
          {team.plan === "agency"
            ? "Unlimited"
            : team.plan === "team"
            ? 5
            : 1}
        </p>
      </>
    ) : (
      <>
        <p className="text-sm font-bold text-violet-900">
          Plan: No Plan Selected
        </p>

        <p className="mt-1 text-sm font-medium text-violet-700">
          No active subscription
        </p>
      </>
    )}
  </div>
)}

    {isTeamOwner &&
(team?.subscription_status === "active" ||
  team?.subscription_status === "trialing") &&
(team?.plan === "team" || team?.plan === "agency") ? (
  <div className="flex gap-3">
    <Input
      value={inviteEmail}
      onChange={(e) => setInviteEmail(e.target.value)}
      placeholder="user@email.com"
    />

    <button
      onClick={inviteUser}
      className="h-12 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white hover:bg-violet-700"
    >
      Create invite link
    </button>
  </div>
    
) : (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
    {!isTeamOwner
  ? "Only the team admin can invite users."
  : team?.subscription_status === "active" ||
    team?.subscription_status === "trialing"
  ? "Solo plans include 1 account. Upgrade to Team or Agency to add additional users."
  : "Choose a subscription plan to unlock team management and additional users."}
  </div>
)}

{inviteLink && (
  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
    <p className="text-sm font-bold text-violet-900">
      Manual invite link
    </p>

    <div className="mt-3 flex gap-2">
      <input
        readOnly
        value={inviteLink}
        className="h-11 flex-1 rounded-xl border border-violet-200 bg-white px-3 text-sm font-medium text-slate-700"
      />

      <button
        onClick={() => navigator.clipboard.writeText(inviteLink)}
        className="rounded-xl bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700"
      >
        Copy
      </button>
    </div>

    <p className="mt-2 text-xs font-medium text-violet-700">
      Email invitations are coming soon. For now, copy this link and send it manually.
    </p>
  </div>
)}

    <div className="space-y-3">
      {members.map((member) => (
  <div
    key={member.id}
    className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
  >
    <div>
      <p className="font-bold text-slate-950">{member.email}</p>
      <p className="text-sm font-medium text-slate-500">
        {member.role === "owner" ? "Admin account" : "User account"}
      </p>
    </div>

    <div className="flex items-center gap-3">
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Active
      </span>

      {isTeamOwner && member.role !== "owner" && (
        <button
          onClick={() => removeMember(member)}
          className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
        >
          Remove
        </button>
      )}
    </div>
  </div>
))}

      {visibleInvites.map((invite) => (
  <div
    key={invite.id}
    className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 p-4"
  >
    <div>
      <p className="font-bold text-slate-950">{invite.email}</p>
      <p className="text-sm font-medium text-orange-700">
        Invite pending
      </p>
    </div>

    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-700">
      Pending
    </span>
  </div>
))}
    </div>
  </div>
</section>

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

      {showRemoveModal && memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-950">
              Remove team member?
            </h2>

            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              This will remove{" "}
              <span className="font-bold text-slate-950">
                {memberToRemove.email}
              </span>{" "}
              from your team.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRemoveModal(false)
                  setMemberToRemove(null)
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmRemoveMember}
                className="h-11 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
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