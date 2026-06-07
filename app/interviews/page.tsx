"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Calendar, Clock, MapPin, Mail, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/browser"

type Interview = {
  id: string
  team_id: string
  email_thread_id?: string
  candidate_name: string
  candidate_email: string
  job_title: string
  slot: string
  location?: string
  meeting_link?: string
calendar_event_id?: string
  created_at: string
}

function parseSlotDate(slot: string) {
  const parsed = new Date(slot)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function formatDay(date: Date | null, fallback: string) {
  if (!date) return fallback

  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(date: Date | null, fallback: string) {
  if (!date) return fallback

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
const [jobFilter, setJobFilter] = useState("All")
const [showCancelModal, setShowCancelModal] = useState(false)
const [selectedInterview, setSelectedInterview] =
  useState<Interview | null>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
const [rescheduleSlot, setRescheduleSlot] = useState("")

  useEffect(() => {
    const loadInterviews = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: membership, error: membershipError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single()

      if (membershipError || !membership) {
        console.error("Could not load team membership:", membershipError)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("team_id", membership.team_id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Could not load interviews:", error)
        setLoading(false)
        return
      }

      setInterviews(data || [])
      setLoading(false)
    }

    loadInterviews()
  }, [])

  const cancelInterview = async (interview: Interview) => {
  

  if (interview.calendar_event_id) {
    const response = await fetch("/api/google/cancel-interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        calendarEventId: interview.calendar_event_id,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      alert(errorData.error || "Could not cancel Google Calendar event.")
      return
    }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from("interviews")
    .delete()
    .eq("id", interview.id)

  if (error) {
    console.error(error)
    alert("Could not remove interview from AptivHire.")
    return
  }

  setInterviews((current) =>
    current.filter((item) => item.id !== interview.id)
  )
}

const rescheduleInterview = async () => {
  if (!selectedInterview || !rescheduleSlot) return

  if (selectedInterview.calendar_event_id) {
    const response = await fetch("/api/google/reschedule-interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        calendarEventId: selectedInterview.calendar_event_id,
        newSlot: rescheduleSlot,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      alert(errorData.error || "Could not reschedule Google Calendar event.")
      return
    }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from("interviews")
    .update({
      slot: rescheduleSlot,
    })
    .eq("id", selectedInterview.id)

  if (error) {
    console.error(error)
    alert("Could not update interview in AptivHire.")
    return
  }

  setInterviews((current) =>
    current.map((interview) =>
      interview.id === selectedInterview.id
        ? { ...interview, slot: rescheduleSlot }
        : interview
    )
  )

  setShowRescheduleModal(false)
  setSelectedInterview(null)
  setRescheduleSlot("")
}

  const jobTitles = useMemo(() => {
  return Array.from(
    new Set(interviews.map((interview) => interview.job_title).filter(Boolean))
  )
}, [interviews])

const filteredInterviews = useMemo(() => {
  return interviews.filter((interview) => {
    const matchesSearch =
      interview.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      interview.candidate_email.toLowerCase().includes(search.toLowerCase())

    const matchesJob =
      jobFilter === "All" || interview.job_title === jobFilter

    return matchesSearch && matchesJob
  })
}, [interviews, search, jobFilter])

  const groupedInterviews = useMemo(() => {
    const groups: Record<string, Interview[]> = {}

    filteredInterviews.forEach((interview) => {
      const date = parseSlotDate(interview.slot)
      const day = formatDay(date, interview.slot)

      if (!groups[day]) {
        groups[day] = []
      }

      groups[day].push(interview)
    })

    return groups
  }, [filteredInterviews])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 space-y-6 px-8 py-7">
          <header>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
              Timetable
            </p>

            <h1 className="mt-2 text-[34px] font-bold tracking-tight text-slate-950">
              Interview Calendar
            </h1>

            <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">
              View upcoming booked interviews from your Supabase interviews table.
            </p>
          </header>

          <section className="grid gap-5 md:grid-cols-3">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
        <Calendar />
      </div>

      <div>
        <p className="text-3xl font-bold tracking-tight text-slate-950">
          {interviews.length}
        </p>

        <p className="text-sm font-semibold text-slate-500">
          Booked interviews
        </p>
      </div>
    </div>

    <a
      href="https://calendar.google.com/calendar/u/0/r"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
    >
      Open Google Calendar
    </a>

  </div>
</div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search candidate or email..."
      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 lg:w-96"
    />

    <select
      value={jobFilter}
      onChange={(e) => setJobFilter(e.target.value)}
      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
    >
      <option value="All">All jobs</option>
      {jobTitles.map((job) => (
        <option key={job} value={job}>
          {job}
        </option>
      ))}
    </select>
  </div>
</section>

          {loading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
              Loading interviews...
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Calendar size={28} />
              </div>

              <h2 className="text-xl font-bold text-slate-950">
                No interviews booked yet
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Once you book candidates from the Emails page, they will appear here.
              </p>
            </div>
          ) : (
            <section className="space-y-6">
              {Object.entries(groupedInterviews).map(([day, dayInterviews]) => (
                <div
                  key={day}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-950">
                    {day}
                  </h2>

                  <div className="space-y-4">
                    {dayInterviews.map((interview) => {
                      const parsedDate = parseSlotDate(interview.slot)

                      return (
                        <div
                          key={interview.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
                                  {interview.candidate_name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")
                                    .slice(0, 2)}
                                </div>

                                <div>
                                  <h3 className="font-bold text-slate-950">
                                    {interview.candidate_name}
                                  </h3>

                                  <p className="text-sm font-medium text-slate-500">
                                    {interview.job_title}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-2 text-sm font-medium text-slate-600">
                                <p className="flex items-center gap-2">
                                  <Mail size={15} />
                                  {interview.candidate_email}
                                </p>

                                <p className="flex items-center gap-2">
                                  <MapPin size={15} />
                                  {interview.location || "No location set"}
                                </p>

                                <div className="mt-3 flex gap-3">
  {interview.meeting_link && (
    <a
      href={interview.meeting_link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700"
    >
      Join Meeting
    </a>
  )}

  <button
  onClick={() => {
    setSelectedInterview(interview)
    setRescheduleSlot(interview.slot)
    setShowRescheduleModal(true)
  }}
  className="inline-flex h-10 items-center justify-center rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-700 hover:bg-violet-50"
>
  Reschedule
</button>

  <button
    
  onClick={() => {
    setSelectedInterview(interview)
    setShowCancelModal(true)
  }}
    className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
  >
    Cancel Interview
  </button>
</div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700">
                              <div className="flex items-center gap-2">
                                <Clock size={16} />
                                {formatTime(parsedDate, interview.slot)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>

        
                      <Footer />
      </div>

      {showRescheduleModal && selectedInterview && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
      <h2 className="text-2xl font-bold text-slate-950">
        Reschedule Interview
      </h2>

      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        Choose a new interview date and time for {selectedInterview.candidate_name}.
      </p>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
        <p><strong>Candidate:</strong> {selectedInterview.candidate_name}</p>
        <p><strong>Role:</strong> {selectedInterview.job_title}</p>
        <p><strong>Current time:</strong> {selectedInterview.slot}</p>
      </div>

      <label className="mt-5 mb-2 block text-sm font-bold text-slate-700">
        New interview time
      </label>

      <input
        type="datetime-local"
        value={rescheduleSlot}
        onChange={(e) => setRescheduleSlot(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      />

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => {
            setShowRescheduleModal(false)
            setSelectedInterview(null)
            setRescheduleSlot("")
          }}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Keep Current Time
        </button>

        <button
          onClick={rescheduleInterview}
          className="h-11 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Confirm Reschedule
        </button>
      </div>
    </div>
  </div>
)}

      {showCancelModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-950">
              Cancel Interview
            </h2>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Are you sure you want to cancel this interview? This will remove it from AptivHire and delete the Google Calendar event.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
              <p><strong>Candidate:</strong> {selectedInterview.candidate_name}</p>
              <p><strong>Role:</strong> {selectedInterview.job_title}</p>
              <p><strong>Date/time:</strong> {selectedInterview.slot}</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setSelectedInterview(null)
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Interview
              </button>

              <button
                onClick={() => {
                  cancelInterview(selectedInterview)
                  setShowCancelModal(false)
                  setSelectedInterview(null)
                }}
                className="h-11 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Cancel Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}