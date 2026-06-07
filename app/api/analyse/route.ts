import { NextResponse } from "next/server"
import OpenAI from "openai"
import AdmZip from "adm-zip"
import mammoth from "mammoth"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

declare global {
  var analysisProgress:
    | {
        total: number
        completed: number
      }
    | undefined
}

globalThis.analysisProgress = globalThis.analysisProgress || {
  total: 0,
  completed: 0,
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type UploadedFile = {
  name: string
  buffer: Buffer
}

type AnalysisResult = {
  fileName: string
  candidateName: string
  email: string
  phone: string
  location: string
  score: number
  status: "Green" | "Amber" | "Red" | "Needs Re-upload"
extractionFailed?: boolean
extractionReason?: string
  recommendation: string
  summary: string
  whyRankedHere: string
  goodFitReasons: string[]
  badFitReasons: string[]
  matchedSkills: string[]
  missingSkills: string[]
  strengths: string[]
  experienceHistory: {
    title: string
    company: string
    location: string
    startDate: string
    endDate: string
    description: string
    technologies: string[]
  }[]
  education: {
    institution: string
    qualification: string
    date: string
  }[]
  certifications: string[]
}

function getStatus(score: number): "Green" | "Amber" | "Red" {
  if (score >= 80) return "Green"
  if (score >= 50) return "Amber"
  return "Red"
}

function getRecommendation(score: number) {
  if (score >= 90) return "Strong Interview"
  if (score >= 80) return "Interview"
  if (score >= 65) return "Review"
  if (score >= 50) return "Possible Review"
  return "Reject"
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ""
}

function extractPhone(text: string) {
  return text.match(/(\+?\d[\d\s\-()]{8,}\d)/)?.[0]?.trim() || ""
}

function cleanCandidateName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/^cv[_\-\s]?\d*[_\-\s]?/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\bCV\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

function scoreAdjustment(fileName: string, candidateName: string) {
  const text = `${fileName}-${candidateName}`
  let hash = 0

  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }

  return (Math.abs(hash) % 7) - 3
}

async function fileToUploadedFile(file: File): Promise<UploadedFile> {
  const arrayBuffer = await file.arrayBuffer()

  return {
    name: file.name,
    buffer: Buffer.from(arrayBuffer),
  }
}

function extractZipFiles(zipFile: UploadedFile): UploadedFile[] {
  const zip = new AdmZip(zipFile.buffer)

  return zip
    .getEntries()
    .filter((entry) => !entry.isDirectory)
    .map((entry) => ({
      name: entry.entryName.split("/").pop() || entry.entryName,
      buffer: entry.getData(),
    }))
    .filter((file) => {
      const name = file.name.toLowerCase()
      return name.endsWith(".pdf") || name.endsWith(".docx")
    })
}

async function extractTextFromUploadedFile(file: UploadedFile) {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    })

    return result.value || ""
  }

  if (fileName.endsWith(".pdf")) {
  try {
    const pdfParse = require("pdf-parse/lib/pdf-parse")
    const data = await pdfParse(file.buffer)

    const text = data.text || ""

    if (!text.trim()) {
      throw new Error("PDF contained no readable text")
    }

    return text
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PDF parse error"

    console.error("PDF parse failed:", {
      fileName: file.name,
      error: message,
    })

    throw new Error(`PDF_EXTRACTION_FAILED:${message}`)
  }
}

  return ""
}

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function safeExperience(value: unknown): AnalysisResult["experienceHistory"] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      title: String(item.title || ""),
      company: String(item.company || ""),
      location: String(item.location || ""),
      startDate: String(item.startDate || ""),
      endDate: String(item.endDate || ""),
      description: String(item.description || ""),
      technologies: Array.isArray(item.technologies)
        ? item.technologies.map(String).filter(Boolean)
        : [],
    }))
    .filter((item) => item.title || item.company || item.description)
}

function safeEducation(value: unknown): AnalysisResult["education"] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      institution: String(item.institution || ""),
      qualification: String(item.qualification || ""),
      date: String(item.date || ""),
    }))
    .filter((item) => item.institution || item.qualification)
}

function parseJsonSafely(raw: string) {
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)

    if (!match) return {}

    try {
      return JSON.parse(match[0])
    } catch {
      return {}
    }
  }
}

function fallbackCandidate(file: UploadedFile, message: string): AnalysisResult {
  return {
    fileName: file.name,
    candidateName: cleanCandidateName(file.name) || file.name,
    email: "",
    phone: "",
    location: "",
    score: 0,
    status: "Red",
    recommendation: "Reject",
    summary: message,
    whyRankedHere: message,
    goodFitReasons: [],
    badFitReasons: [],
    matchedSkills: [],
    missingSkills: [],
    strengths: [],
    experienceHistory: [],
    education: [],
    certifications: [],
  }
}

async function analyseOneCandidate(
  file: UploadedFile,
  jobTitle: string,
  jobDescription: string
): Promise<AnalysisResult> {
  try {
    const cvText = await extractTextFromUploadedFile(file)

    if (!cvText.trim()) {
      return fallbackCandidate(
        file,
        "Could not extract readable text from this CV."
      )
    }

    const email = extractEmail(cvText)
    const phone = extractPhone(cvText)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are AptivHire, an expert recruitment analyst. You must return strict valid JSON only.",
        },
        {
          role: "user",
          content: `
Analyse this CV against the job description.

Rules:
- Score from 0 to 100.
- Use the full scoring range.
- Do not cluster candidates around the same scores.
- Avoid giving multiple candidates scores within 2 points of each other unless their CVs are genuinely almost identical.
- Be strict and comparative.
- Strong candidates should usually score 80-95.
- Good but incomplete candidates should usually score 65-79.
- Average candidates should usually score 45-64.
- Weak candidates should usually score 20-44.
- Very weak candidates should usually score 1-19.
- The score, recommendation, goodFitReasons and badFitReasons must be consistent with each other.
- If the score is below 50, the recommendation should usually be "Reject" or "Possible Review".
- If the score is below 50, include clear concerns explaining the low score.
- If the score is 50-79, include both positives and concerns.
- If the score is 80+, include strong positives and any minor risks.

- Score consistency rules:
  - If score >= 90, missingSkills should usually be empty, but badFitReasons should still include any minor risks or development areas.
  - If score >= 90 and a concern exists, include it in badFitReasons as a minor risk rather than missingSkills.
  - If missingSkills contains 2 or more important requirements, the score should rarely exceed 85.
  - If a candidate has fewer missingSkills and equally strong goodFitReasons, they should normally rank higher.
  - The score, recommendation, missingSkills, goodFitReasons and badFitReasons must be logically consistent.
  - Every candidate must include at least 1-3 genuine concerns, risks, gaps, or development areas unless the CV is exceptionally strong.
- Concerns can be minor and should not automatically reduce the score significantly.
- A concern may be:
  - missing evidence
  - limited industry exposure
  - limited scale of responsibility
  - lack of specific examples
  - missing certifications
  - unclear achievements
  - limited leadership scope
- Do not leave badFitReasons empty unless there are genuinely no concerns.

- Penalise missing evidence clearly.
- Reward exact job-description matches strongly.
- Score based on:
  1. exact required skills match
  2. commercial experience level
  3. project relevance
  4. seniority
  5. education/certifications
  6. communication and clarity of CV
- Do not invent work experience, education, certifications, employers, dates, locations, or skills.
- Only include evidence found in the CV.
- If something is not found, return an empty array or empty string.
- goodFitReasons should contain 1-6 recruiter-friendly reasons.
- Even for weak candidates, include any genuine transferable strengths or partial matches found in the CV.
- Do not invent strengths. If there are no relevant strengths at all, return an empty array.
- Each goodFitReason should be 2 sentences maximum.
- Each goodFitReason should include specific evidence from the CV where possible.
- Do not write vague reasons like "Good technical skills".
- Explain why the evidence matters for this job.

- badFitReasons should contain 2-6 specific gaps, risks, or missing evidence.
- For weak candidates, badFitReasons must explain the main reasons the score is low.
- If the score is below 50, badFitReasons should not be empty.
- Each badFitReason should explain why the gap matters.
- experienceHistory must contain only real roles from the CV.
- education must contain only real education from the CV.
- certifications must contain only real certifications from the CV.
- summary should be 2-4 sentences.
- matchedSkills should be skills from the CV that match the job.
- missingSkills should be important job requirements not clearly evidenced in the CV.
- strengths should be 1-5 short candidate-specific strengths.

Job Title:
${jobTitle}

Job Description:
${jobDescription}

CV Text:
${cvText.slice(0, 12000)}

- whyRankedHere should explain in 1-2 sentences why this candidate ranked where they did.
- Do not mention the exact numeric score.
- Mention the biggest strengths.
- Mention any deductions.
- Mention the biggest strengths.
- Mention any deductions.

Return ONLY valid JSON in this exact shape:

{
  "candidateName": "",
  "location": "",
  "score": 0,
  "summary": "",
  "goodFitReasons": [],
  "badFitReasons": [],
  "matchedSkills": [],
  "missingSkills": [],
  "whyRankedHere": "",
  "strengths": [],
  "experienceHistory": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "description": "",
      "technologies": []
    }
  ],
  "education": [
    {
      "institution": "",
      "qualification": "",
      "date": ""
    }
  ],
  "certifications": []
}
          `,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    const parsed = parseJsonSafely(raw)

    const baseScore = Math.max(0, Math.min(100, Number(parsed.score) || 0))

    const adjustedScore =
      baseScore === 0
        ? 0
        : Math.max(
            1,
            Math.min(
              100,
              baseScore +
                scoreAdjustment(file.name, String(parsed.candidateName || ""))
            )
          )

    const score = adjustedScore

    const goodFitReasons = safeArray(parsed.goodFitReasons)
    const strengths = safeArray(parsed.strengths)

    return {
      fileName: file.name,
      candidateName:
        String(parsed.candidateName || "").trim() ||
        cleanCandidateName(file.name) ||
        file.name,
      email,
      phone,
      location: String(parsed.location || ""),
      score,
      status: getStatus(score),
      recommendation: getRecommendation(score),
      summary: String(parsed.summary || ""),
      whyRankedHere: String(parsed.whyRankedHere || ""),
      goodFitReasons,
      badFitReasons: safeArray(parsed.badFitReasons),
      matchedSkills: safeArray(parsed.matchedSkills),
      missingSkills: safeArray(parsed.missingSkills),
      strengths: strengths.length ? strengths : goodFitReasons.slice(0, 5),
      experienceHistory: safeExperience(parsed.experienceHistory),
      education: safeEducation(parsed.education),
      certifications: safeArray(parsed.certifications),
    }
  } catch (error) {
  const message =
    error instanceof Error ? error.message : "Could not analyse this CV."

  if (message.startsWith("PDF_EXTRACTION_FAILED:")) {
    return {
      fileName: file.name,
      candidateName: cleanCandidateName(file.name) || file.name,
      email: "",
      phone: "",
      location: "",
      score: 0,
      status: "Needs Re-upload",
      recommendation: "Please re-upload as DOCX or text-based PDF",
      summary: "Unreadable CV",
      whyRankedHere: "This candidate could not be ranked because the PDF text could not be extracted.",
      extractionFailed: true,
      extractionReason: message.replace("PDF_EXTRACTION_FAILED:", ""),
      goodFitReasons: [],
      badFitReasons: [
        "CV text could not be extracted from the uploaded PDF.",
      ],
      matchedSkills: [],
      missingSkills: [],
      strengths: [],
      experienceHistory: [],
      education: [],
      certifications: [],
    }
  }

  return fallbackCandidate(file, message)
}
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "AptivHire analyse API is working.",
  })
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is missing." },
        { status: 500 }
      )
    }

    const formData = await request.formData()

    const jobTitle = String(formData.get("jobTitle") || "")
    const jobDescription = String(formData.get("jobDescription") || "")
    const uploadedFiles = formData.getAll("files") as File[]

    if (!jobTitle.trim()) {
      return NextResponse.json(
        { success: false, error: "Job title is required." },
        { status: 400 }
      )
    }

    if (!jobDescription.trim()) {
      return NextResponse.json(
        { success: false, error: "Job description is required." },
        { status: 400 }
      )
    }

    if (!uploadedFiles.length) {
      return NextResponse.json(
        { success: false, error: "Please upload at least one CV." },
        { status: 400 }
      )
    }

    let files: UploadedFile[] = []

    for (const file of uploadedFiles) {
      const uploadedFile = await fileToUploadedFile(file)

      if (file.name.toLowerCase().endsWith(".zip")) {
        files.push(...extractZipFiles(uploadedFile))
      } else {
        files.push(uploadedFile)
      }
    }

    const cvFiles = files.filter((file) => {
      const name = file.name.toLowerCase()
      return name.endsWith(".pdf") || name.endsWith(".docx")
    })

    globalThis.analysisProgress = {
  total: cvFiles.length,
  completed: 0,
}

    if (!cvFiles.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Please upload at least one PDF or DOCX CV.",
        },
        { status: 400 }
      )
    }

    const results: AnalysisResult[] = []

    const batchSize = 100

for (let i = 0; i < cvFiles.length; i += batchSize) {
  const batch = cvFiles.slice(i, i + batchSize)

  const batchResults = await Promise.all(
    batch.map(async (file) => {
      const result = await analyseOneCandidate(file, jobTitle, jobDescription)

      globalThis.analysisProgress!.completed = Math.min(
  globalThis.analysisProgress!.completed + 1,
  globalThis.analysisProgress!.total
)

      return result
    })
  )

  results.push(...batchResults)
}

    const rankableResults = results
  .filter((candidate) => !candidate.extractionFailed)
  .sort((a, b) => {
  if (b.score !== a.score) {
    return b.score - a.score
  }

  const aMissing = a.missingSkills?.length || 0
  const bMissing = b.missingSkills?.length || 0

  return aMissing - bMissing
})
  .map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
  }))

const failedResults = results
  .filter((candidate) => candidate.extractionFailed)
  .map((candidate) => ({
    ...candidate,
    rank: null,
  }))

const rankedResults = [...rankableResults, ...failedResults]

    return NextResponse.json({
      success: true,
      results: rankedResults,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    )
  }
}