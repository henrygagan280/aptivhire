"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Calendar,
  Clock,
  Inbox,
  Mail,
  MessageSquareReply,
  RefreshCw,
  ShieldCheck,
  X,
  Search,
  Sparkles,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/browser"

type EmailStatus = "Invite sent" | "Rejection sent" | "Replied" | "Booked"

type EmailThread = {

  id: string
  teamId: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  status: EmailStatus
  subject: string
  lastMessage: string
  sentAt: string
  repliedAt?: string
  availability?: string[]
  bookedSlot?: string
  location?: string
  replyDraft?: string
recruiterNotes?: string
}



export default function EmailsPage() {
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null)
  const [statusFilter, setStatusFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("Google Meet")
  const [interviewType, setInterviewType] = useState<"google_meet" | "in_person">("google_meet")
  const [connected, setConnected] = useState(false)
  const [replyDraft, setReplyDraft] = useState("")
const [availabilityInput, setAvailabilityInput] = useState("")
const [replyStatus, setReplyStatus] = useState("")
const [bookingLoading, setBookingLoading] = useState(false)
const [showConfirmationEmail, setShowConfirmationEmail] = useState(false)
const [confirmationEmail, setConfirmationEmail] = useState("")
const [confirmationSubject, setConfirmationSubject] = useState("")
const [confirmationStatus, setConfirmationStatus] = useState("")
  

  useEffect(() => {
  const loadThreads = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single()

    if (!membership) return

    const { data: rows, error } = await supabase
      .from("email_threads")
      .select("*")
      .eq("team_id", membership.team_id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Failed to load email threads:", error)
      return
    }



    const mappedThreads: EmailThread[] =
      rows?.map((row) => ({
        id: row.id,
        teamId: row.team_id,
        candidateName: row.candidate_name,
        candidateEmail: row.candidate_email,
        jobTitle: row.job_title || "",
        status: row.status,
        subject: row.subject || "",
        lastMessage: row.last_message || "",
        sentAt: row.sent_at,
        repliedAt: row.replied_at,
        availability: row.availability || [],
        bookedSlot: row.booked_slot,
        location: row.location,
        replyDraft: row.reply_draft || "",
recruiterNotes: row.recruiter_notes || "",
      })) || []

    setThreads(mappedThreads)

    const { data: googleConnection } = await supabase
  .from("google_connections")
  .select("id")
  .eq("user_id", user.id)
  .maybeSingle()

setConnected(!!googleConnection)
    }
  loadThreads()
}, [])

const sendReply = async () => {
  if (!selectedThread) return

  const response = await fetch("/api/google/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: selectedThread.candidateEmail,
      subject: `Re: ${selectedThread.subject}`,
      message: replyDraft,
    }),
  })

  if (!response.ok) {
  const errorData = await response.json()

  console.error("Send email failed:", errorData)

  alert(
    errorData.error ||
    JSON.stringify(errorData)
  )

  return
}

  const supabase = createClient()

  const { error } = await supabase
    .from("email_threads")
    .update({
      reply_draft: replyDraft,
      last_message: replyDraft,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectedThread.id)

  if (error) {
    console.error(error)
    return
  }

  setReplyStatus("Reply sent")

  setTimeout(() => {
    setReplyStatus("")
  }, 2500)
}

  const connectGmail = () => {
    window.location.href = "/api/google/connect"
  }

  const sendConfirmationEmail = async () => {
  if (!selectedThread || !confirmationEmail.trim()) return

  const response = await fetch("/api/google/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: selectedThread.candidateEmail,
      subject: confirmationSubject,
      message: confirmationEmail,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Confirmation email failed:", errorData)
    alert(errorData.error || JSON.stringify(errorData))
    return
  }

  setConfirmationStatus(
  `Interview confirmation sent to ${selectedThread.candidateName}`
)

setTimeout(() => {
  setConfirmationStatus("")
  setShowConfirmationEmail(false)
}, 1500)
}

  const syncInbox = () => {
    alert(
      "Gmail sync placeholder. Later this will call your backend, fetch Gmail replies, detect availability and update threads automatically."
    )
  }

  function normaliseDateTimeLocal(value: string) {
  if (!value) return ""

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value
  }

  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
  )

  if (match) {
    const [, day, month, year, hour, minute] = match

    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  return ""
}

  const openBooking = (thread: EmailThread) => {
  setSelectedThread(thread)
  setSelectedSlot(normaliseDateTimeLocal(thread.availability?.[0] || ""))
  setInterviewType("google_meet")
  setMeetingLocation("Google Meet")
  setShowBookingModal(true)
}

  const confirmBooking = async () => {
  if (!selectedThread || !selectedSlot.trim()) return

  if (
  !selectedThread.candidateEmail ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedThread.candidateEmail)
) {
  alert("This candidate does not have a valid email address, so a calendar invite cannot be created.")
  return
}

  if (bookingLoading) return
setBookingLoading(true)


  

  const supabase = createClient()

  const { data: existingInterview, error: conflictError } = await supabase
  .from("interviews")
  .select("id")
  .eq("team_id", selectedThread.teamId)
  .eq("slot", selectedSlot)
  .maybeSingle();

if (conflictError) {
  console.error(conflictError)
  alert("Could not check slot availability.")
  setBookingLoading(false)
  return
}

if (existingInterview) {
  alert("This slot is already booked. Please choose another time.")
  setBookingLoading(false)
  return
}

const calendarResponse = await fetch("/api/google/create-interview", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  candidateName: selectedThread.candidateName,
  candidateEmail: selectedThread.candidateEmail,
  jobTitle: selectedThread.jobTitle,
  slot: selectedSlot,
  location: meetingLocation,
  interviewType,
}),
})

if (!calendarResponse.ok) {
  const errorData = await calendarResponse.json()
  console.error("Failed to create Google Calendar event:", errorData)
  alert(errorData.error || "Could not create Google Meet link.")
  setBookingLoading(false)
  return
}

const { meetingLink, calendarEventId } = await calendarResponse.json()

const interviewLocation = meetingLink || meetingLocation

const { error: interviewError } = await supabase
  .from("interviews")
  .insert({
    team_id: selectedThread.teamId,
    email_thread_id: selectedThread.id,
    candidate_name: selectedThread.candidateName,
    candidate_email: selectedThread.candidateEmail,
    job_title: selectedThread.jobTitle,
    slot: selectedSlot,
    location: interviewLocation,
    meeting_link: meetingLink,
    calendar_event_id: calendarEventId,
  })

if (interviewError) {
  console.error("Failed to create interview:", interviewError)
  alert("Could not create interview booking.")
  setBookingLoading(false)
  return
}

  const { error } = await supabase
    .from("email_threads")
    .update({
      status: "Booked",
      booked_slot: selectedSlot,
      location: interviewLocation,
      last_message: `Interview booked for ${selectedSlot} at ${interviewLocation}.`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectedThread.id)

  if (error) {
  console.error("Failed to book interview:", error)
  alert("Could not save booking.")
  setBookingLoading(false)
  return
}

  const updated = threads.map((thread) =>
    thread.id === selectedThread.id
      ? {
          ...thread,
          status: "Booked" as EmailStatus,
          bookedSlot: selectedSlot,
          location: interviewLocation,
          lastMessage: `Interview booked for ${selectedSlot} at ${meetingLocation}.`,
        }
      : thread
  )

  setThreads(updated)

  setSelectedThread({
  ...selectedThread,
  status: "Booked",
  bookedSlot: selectedSlot,
  location: interviewLocation,
  lastMessage: `Interview booked for ${selectedSlot} at ${meetingLocation}.`,
})
  const formattedSlot = new Date(selectedSlot).toLocaleString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

setConfirmationSubject(`Interview confirmed: ${selectedThread.jobTitle}`)

if (interviewType === "in_person") {
  setConfirmationEmail(
    `Hi ${selectedThread.candidateName},

Your interview for the ${selectedThread.jobTitle} role has been confirmed.

Date/time: ${formattedSlot}
Location: ${interviewLocation}

This interview will take place in person. Please aim to arrive 5–10 minutes early so there is enough time for check-in.

Dress code guidance: smart casual or interview-appropriate attire is recommended. You do not need to wear anything overly formal unless you would prefer to.

Please bring anything you may need for the interview, such as a copy of your CV, portfolio, notes, or identification if required at reception.

If you have any issues finding the location or need to rearrange, please reply to this email.

Best,
AptivHire`
  )
} else {
  setConfirmationEmail(
    `Hi ${selectedThread.candidateName},

Your interview for the ${selectedThread.jobTitle} role has been confirmed.

Date/time: ${formattedSlot}
Location: Google Meet
Meeting link: ${interviewLocation}

Please join a few minutes early and make sure your camera, microphone and internet connection are working before the interview.

If you need to rearrange, please reply to this email.

Best,
AptivHire`
  )
}

setBookingLoading(false)
setShowBookingModal(false)
setShowConfirmationEmail(true)
  
}

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesStatus =
        statusFilter === "All" || thread.status === statusFilter

      const matchesSearch =
        thread.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        thread.candidateEmail.toLowerCase().includes(search.toLowerCase()) ||
        thread.jobTitle.toLowerCase().includes(search.toLowerCase())

      return matchesStatus && matchesSearch
    })
  }, [threads, statusFilter, search])

  const repliedCount = threads.filter((t) => t.status === "Replied").length
  const bookedCount = threads.filter((t) => t.status === "Booked").length
  const pendingCount = threads.filter(
    (t) => t.status === "Invite sent" || t.status === "Rejection sent"
  ).length

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 space-y-6 px-8 py-7">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
                Email Centre
              </p>
              <h1 className="mt-2 text-[34px] font-bold tracking-tight text-slate-950">
                Candidate Emails
              </h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">
                Track interview invites, rejection emails, candidate replies and interview bookings in one polished inbox.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={syncInbox}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <RefreshCw size={17} />
                Sync Inbox
              </button>

              <button
                onClick={connectGmail}
                className={`inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold shadow-sm transition ${
                  connected
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "bg-violet-600 text-white shadow-violet-200 hover:bg-violet-700"
                }`}
              >
                <ShieldCheck size={17} />
                {connected ? "Gmail Connected" : "Connect Gmail"}
              </button>
            </div>
          </header>

          <section className="grid gap-5 md:grid-cols-3">
            <MetricCard icon={<Inbox />} label="Tracked emails" value={threads.length} />
            <MetricCard icon={<MessageSquareReply />} label="Replies received" value={repliedCount} />
            <MetricCard icon={<Calendar />} label="Interviews booked" value={bookedCount} />
          </section>

          {!connected && (
            <section className="rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-slate-50 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-950">
                    Gmail connection coming next
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    This page is ready for Gmail sync. For now, it uses saved email threads locally. Real Gmail replies will require Google OAuth and backend inbox sync.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option>All</option>
                  <option>Invite sent</option>
                  <option>Rejection sent</option>
                  <option>Replied</option>
                  <option>Booked</option>
                </select>

                <div className="inline-flex h-11 items-center rounded-2xl border border-violet-100 bg-violet-50 px-4 text-sm font-semibold text-violet-700">
                  Pending: {pendingCount}
                </div>
              </div>

              <div className="relative w-full lg:w-96">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidate, email or job..."
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <div className="space-y-4">
              {filteredThreads.length ? (
                filteredThreads.map((thread) => (
                  <EmailThreadCard
                    key={thread.id}
                    thread={thread}
                    selected={selectedThread?.id === thread.id}
                    onSelect={() => {
  setSelectedThread(thread)
  setReplyDraft(thread.replyDraft || "")
}}
                    onBook={() => openBooking(thread)}
                  />
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
                  No email threads found.
                </div>
              )}
            </div>

            <aside className="min-h-[420px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedThread ? (
                <div>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-950">
                        {selectedThread.candidateName}
                      </h2>
                      <p className="text-sm font-medium text-slate-500">
                        {selectedThread.candidateEmail}
                      </p>
                    </div>

                    <StatusBadge status={selectedThread.status} />
                  </div>

                  <div className="space-y-4 text-sm">
                    <InfoRow label="Job" value={selectedThread.jobTitle} />
                    <InfoRow label="Subject" value={selectedThread.subject} />
                    <InfoRow label="Sent" value={selectedThread.sentAt} />
                    {selectedThread.repliedAt && (
                      <InfoRow label="Replied" value={selectedThread.repliedAt} />
                    )}
                    {selectedThread.bookedSlot && (
                      <InfoRow
                        label="Interview"
                        value={`${selectedThread.bookedSlot} · ${selectedThread.location}`}
                      />
                    )}
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 font-bold text-slate-950">
                      Latest message
                    </p>
                    <p className="text-sm font-medium leading-6 text-slate-600">
                      {selectedThread.lastMessage}
                    </p>
                  </div>

                  <div className="mt-6">
  <p className="mb-2 font-bold text-slate-950">
  Email Reply
</p>

  <textarea
    value={replyDraft}
    onChange={(e) => setReplyDraft(e.target.value)}
    placeholder="Write your reply to the candidate..."
    className="min-h-[140px] w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
  />

  <button
    onClick={sendReply}
    className="mt-3 h-11 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700"
  >
    Send Reply
  </button>

  {replyStatus && (
  <p className="mt-2 text-sm font-semibold text-emerald-600">
    {replyStatus}
  </p>
)}
</div>

                  {selectedThread.availability?.length ? (
                    <div className="mt-6">
                      <p className="mb-3 font-bold text-slate-950">
                        Detected availability
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedThread.availability.map((slot) => (
                          <span
                            key={slot}
                            className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6">
  

  <button
    onClick={() => {
      if (!selectedThread || !availabilityInput.trim()) return

      const updatedAvailability = [
        ...(selectedThread.availability || []),
        availabilityInput.trim(),
      ]

      const updatedThread = {
        ...selectedThread,
        availability: updatedAvailability,
        status: "Replied" as EmailStatus,
      }

      setSelectedThread(updatedThread)

      setThreads((current) =>
        current.map((thread) =>
          thread.id === selectedThread.id ? updatedThread : thread
        )
      )

      setAvailabilityInput("")
    }}
    className="mt-3 h-10 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
  >
    Add Availability
  </button>
</div>

                  {(selectedThread.status === "Replied" || selectedThread.status === "Invite sent") && (
                    <button
                      onClick={() => openBooking(selectedThread)}
                      className="mt-6 h-11 w-full rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
                    >
                      Book Interview
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                    <Mail size={30} />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    Select an email thread
                  </h2>
                  <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
                    Choose a candidate email to view replies, detected availability and booking actions.
                  </p>
                </div>
              )}
            </aside>
          </section>
        </main>

        <Footer />
      </div>

      {showBookingModal && selectedThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Book Interview
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Choose one of {selectedThread.candidateName}'s available times.
                </p>
              </div>

              

              <button
                onClick={() => setShowBookingModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Candidate availability
                </label>

                <input
  type="datetime-local"
  value={selectedSlot}
  onChange={(e) => setSelectedSlot(e.target.value)}
  className="mb-3 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
/>

                <div className="grid gap-2">

                  
                  {(selectedThread.availability || []).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        selectedSlot === slot
                          ? "border-violet-300 bg-violet-50 text-violet-700 ring-4 ring-violet-100"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
  <label className="mb-2 block text-sm font-bold text-slate-700">
    Interview type
  </label>

  <select
    value={interviewType}
    onChange={(e) => {
      const value = e.target.value as "google_meet" | "in_person"

      setInterviewType(value)

      if (value === "google_meet") {
        setMeetingLocation("Google Meet")
      } else {
        setMeetingLocation("")
      }
    }}
    className="mb-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
  >
    <option value="google_meet">Google Meet</option>
    <option value="in_person">In Person</option>
  </select>

  {interviewType === "in_person" && (
    <input
      value={meetingLocation}
      onChange={(e) => setMeetingLocation(e.target.value)}
      placeholder="Office address..."
      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
    />
  )}
</div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
  onClick={confirmBooking}
  disabled={bookingLoading}
  className="h-11 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {bookingLoading ? "Booking..." : "Confirm Booking"}
</button>
            </div>
          </div>
        </div>
      )}

{showConfirmationEmail && selectedThread && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
    <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Confirmation Email
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Review this email before sending it to {selectedThread.candidateName}.
          </p>
        </div>

        <button
          onClick={() => {
  setConfirmationStatus("")
  setShowConfirmationEmail(false)
}}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <X size={16} />
        </button>
      </div>

      {confirmationStatus && (
  <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
    <p className="text-sm font-semibold text-emerald-700">
      ✅ {confirmationStatus}
    </p>
  </div>
)}

      <div className="mb-4 rounded-2xl bg-slate-50 p-4">
  <p className="text-sm font-semibold text-slate-500">To</p>
  <p className="text-sm font-bold text-slate-950">
    {selectedThread.candidateEmail}
  </p>
</div>

<label className="mb-2 block text-sm font-bold text-slate-700">
  Subject
</label>

<input
  value={confirmationSubject}
  onChange={(e) => setConfirmationSubject(e.target.value)}
  className="mb-4 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
/>

      <label className="mb-2 block text-sm font-bold text-slate-700">
        Email message
      </label>

      <textarea
  value={confirmationEmail}
  onChange={(e) => setConfirmationEmail(e.target.value)}
  className="h-[420px] w-full rounded-2xl border border-slate-200 p-5 text-sm font-medium leading-7 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
/>

      <div className="mt-6 flex justify-end gap-3">
        <button
          
  onClick={() => {
    setConfirmationStatus("")
    setShowConfirmationEmail(false)
  }}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>

        <button
  onClick={sendConfirmationEmail}
          className="h-11 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700"
        >
          Send Confirmation
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  )
}

function EmailThreadCard({
  thread,
  selected,
  onSelect,
  onBook,
}: {
  thread: EmailThread
  selected: boolean
  onSelect: () => void
  onBook: () => void
}) {
  return (
    <div
      className={`rounded-[28px] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-violet-300 ring-4 ring-violet-100" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-300 font-bold text-white shadow-sm">
              {thread.candidateName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div>
              <h3 className="font-bold text-slate-950">
                {thread.candidateName}
              </h3>
              <p className="text-sm font-medium text-slate-500">
                {thread.candidateEmail}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-bold text-slate-950">
            {thread.subject}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-slate-600">
            {thread.lastMessage}
          </p>
        </button>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <StatusBadge status={thread.status} />

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Clock size={14} />
            {thread.repliedAt || thread.sentAt}
          </div>

          {thread.status === "Replied" || thread.status === "Invite sent" && (
            <button
              onClick={onBook}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700"
            >
              <Calendar size={16} />
              Book Interview
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: EmailStatus }) {
  const styles = {
    "Invite sent": "bg-violet-50 text-violet-700 border-violet-100",
    "Rejection sent": "bg-red-50 text-red-700 border-red-100",
    Replied: "bg-blue-50 text-blue-700 border-blue-100",
    Booked: "bg-emerald-50 text-emerald-700 border-emerald-100",
  }

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          {icon}
        </div>

        <div>
          <p className="text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  )
}