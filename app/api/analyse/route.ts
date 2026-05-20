import { NextResponse } from "next/server";
import OpenAI from "openai";
import AdmZip from "adm-zip";
import { extractText } from "@/lib/extractText";

let analysisProgress = {
  total: 0,
  completed: 0,
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type UploadedFile = {
  name: string;
  buffer: Buffer;
  text?: () => Promise<string>;
};

function getStatus(score: number) {
  if (score >= 80) return "Green";
  if (score >= 50) return "Amber";
  return "Red";
}

function getRecommendation(score: number) {
  if (score >= 90) return "Strong Interview";
  if (score >= 80) return "Interview";
  if (score >= 65) return "Review";
  if (score >= 50) return "Possible Review";
  return "Reject";
}

function parseCSV(csvText: string) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    return row;
  });
}

function findApplicantForFile(
  fileName: string,
  applicants: Record<string, string>[]
) {
  const cleanFileName = fileName.split("/").pop()?.toLowerCase();

  return applicants.find((applicant) => {
    const cvFilename =
      applicant["CV Filename"] ||
      applicant["CV filename"] ||
      applicant["Resume Filename"] ||
      applicant["Resume filename"];

    return cvFilename?.toLowerCase() === cleanFileName;
  });
}

function scoreAdjustment(fileName: string, candidateName: string) {
  const text = `${fileName}-${candidateName}`;
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return (Math.abs(hash) % 7) - 3;
}

async function fileToUploadedFile(file: File): Promise<UploadedFile> {
  const arrayBuffer = await file.arrayBuffer();

  return {
    name: file.name,
    buffer: Buffer.from(arrayBuffer),
    text: async () => file.text(),
  };
}

function extractZipFiles(zipFile: UploadedFile): UploadedFile[] {
  const zip = new AdmZip(zipFile.buffer);
  const entries = zip.getEntries();

  return entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => ({
      name: entry.entryName.split("/").pop() || entry.entryName,
      buffer: entry.getData(),
      text: async () => entry.getData().toString("utf-8"),
    }));
}

async function extractTextFromUploadedFile(file: UploadedFile): Promise<string> {
  const fakeFile = new File([new Uint8Array(file.buffer)], file.name);

  return extractText(fakeFile);
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "AptivHire analyse API is working.",
  });
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const jobTitle = String(formData.get("jobTitle") || "");
    const jobDescription = String(formData.get("jobDescription") || "");
    const uploadedFiles = formData.getAll("files") as File[];

    if (!jobTitle.trim()) {
      return NextResponse.json(
        { success: false, error: "Job title is required." },
        { status: 400 }
      );
    }

    if (!jobDescription.trim()) {
      return NextResponse.json(
        { success: false, error: "Job description is required." },
        { status: 400 }
      );
    }

    let files: UploadedFile[] = [];

    for (const file of uploadedFiles) {
      const uploadedFile = await fileToUploadedFile(file);

      if (file.name.toLowerCase().endsWith(".zip")) {
        files = [...files, ...extractZipFiles(uploadedFile)];
      } else {
        files.push(uploadedFile);
      }
    }

    const csvFiles = files.filter((file) =>
      file.name.toLowerCase().endsWith(".csv")
    );

    const cvFiles = files.filter(
      (file) =>
        file.name.toLowerCase().endsWith(".pdf") ||
        file.name.toLowerCase().endsWith(".docx")
    );

    if (!cvFiles.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Please upload at least one PDF or DOCX CV.",
        },
        { status: 400 }
      );
    }

    let applicants: Record<string, string>[] = [];

    for (const csvFile of csvFiles) {
      const csvText = await csvFile.text!();
      applicants = [...applicants, ...parseCSV(csvText)];
    }

    const analyseOneCandidate = async (file: any) => {
  try {
    const applicant = findApplicantForFile(file.name, applicants);
    const cvText = await extractTextFromUploadedFile(file);

    if (!cvText.trim()) {
      return {
        fileName: file.name,
        candidateName:
          applicant?.["Candidate Name"] ||
          applicant?.["Name"] ||
          file.name,
        email: applicant?.["Email"] || "",
        phone: applicant?.["Phone"] || "",
        score: 0,
        status: "Red",
        recommendation: "Reject",
        summary: "Could not extract readable text from this CV.",
        matchedSkills: [],
        missingSkills: [],
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are AptivHire, an elite AI recruitment analyst. Return strict JSON only.",
        },
        {
          role: "user",
          content: `
Compare this CV against the job description and score the candidate accurately.

IMPORTANT:
- Score from 0 to 100.
- Do not round scores to the nearest 5 or 10.
- Use precise scores like 87, 74, 63, 41, 22, 13.
- Only use 0 if the CV is unreadable, empty, or completely irrelevant.
- Weak candidates should normally score between 10 and 35, not automatically 0.

SCORING GUIDE:

90-100:
Exceptional fit. Strong relevant experience. Matches nearly all required skills.

80-89:
Very strong fit. Matches most required skills and experience.

65-79:
Good fit. Some missing skills but generally suitable.

50-64:
Average fit. Several gaps or weak relevance.

30-49:
Weak fit. Limited relevant experience or missing major requirements.

10-29:
Very poor fit. Use varied scores between 10 and 29 depending on transferable experience. Do not repeatedly use 12.

0-9:
Unreadable, empty, or almost no relevant information.

Use highly specific individual scores.

Do not give multiple candidates the same score unless their CVs are genuinely almost identical.

Avoid defaulting to common scores like 65, 68, 70, 75, 80, or 85.

Use the full numeric range with precise scores such as 72, 76, 81, 87, 43, 29, 18.

When candidates are similar, separate them by small differences based on:
- number of matched required skills
- strength of evidence
- years of relevant experience
- quality of projects
- seniority
- communication evidence
- exact role relevance

Job Title:
${jobTitle}

Job Description:
${jobDescription}

Applicant Metadata:
${JSON.stringify(applicant || {}, null, 2)}

CV:
${cvText.slice(0, 9000)}

Return ONLY valid JSON in this exact format:

{
  "candidateName": "",
  The score must be an exact integer from 0 to 100.
Do not round to the nearest 5 or 10.
Do not overuse the same score across candidates.
  "score": 0,
  "summary": "",
  "matchedSkills": [],
  "missingSkills": []
}
          `,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    const baseScore = Math.max(0, Math.min(100, Number(parsed.score) || 0));

const adjustedScore =
  baseScore === 0
    ? 0
    : Math.max(
        1,
        Math.min(
          100,
          baseScore + scoreAdjustment(file.name, parsed.candidateName || "")
        )
      );

const score = adjustedScore;
    const recommendation = getRecommendation(score);

    return {
      fileName: file.name,
      candidateName:
        parsed.candidateName ||
        applicant?.["Candidate Name"] ||
        applicant?.["Name"] ||
        file.name,
      email: applicant?.["Email"] || "",
      phone: applicant?.["Phone"] || "",
      score,
      status: getStatus(score),
      recommendation,
      summary: parsed.summary || "",
      matchedSkills: Array.isArray(parsed.matchedSkills)
        ? parsed.matchedSkills
        : [],
      missingSkills: Array.isArray(parsed.missingSkills)
        ? parsed.missingSkills
        : [],
    };
  } catch (error) {
    return {
      fileName: file.name,
      candidateName: file.name,
      score: 0,
      status: "Red",
      recommendation: "Reject",
      summary:
        error instanceof Error ? error.message : "Could not analyse this CV.",
      matchedSkills: [],
      missingSkills: [],
    };
  }
};

globalThis.analysisProgress = {
  total: cvFiles.length,
  completed: 0,
};

const results = [];

const batchSize = 50;

for (let i = 0; i < cvFiles.length; i += batchSize) {
  const batch = cvFiles.slice(i, i + batchSize);
  const batchResults = await Promise.all(
  batch.map(async (file) => {
    const result = await analyseOneCandidate(file);

    globalThis.analysisProgress.completed += 1;

    return result;
  })
);

  results.push(...batchResults);
}

    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}