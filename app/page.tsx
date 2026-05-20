

"use client";



import { useState } from "react";



type CandidateResult = {
  fileName: string;
  candidateName: string;
  score: number;
  status: "Green" | "Amber" | "Red";
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  recommendation: string;
  email?: string;
  phone?: string;
};

function statusColor(status: string) {
  if (status === "Green") return "#16a34a";
  if (status === "Amber") return "#f59e0b";
  return "#dc2626";
}

export default function DemoPage() {
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyse() {
    console.log("Button clicked");

    try {
      setLoading(true);
      setError("");
      setResults([]);

      // START PROGRESS BAR
    setProgress(5);
    setProgressMessage("Uploading files...");

    const progressTimer = setInterval(() => {
      setProgress((current) => {
        if (current < 30) {
          setProgressMessage("Extracting applicant files...");
          return current + 4;
        }

        if (current < 60) {
          setProgressMessage("Reading CVs and matching applicants...");
          return current + 3;
        }

        if (current < 90) {
          setProgressMessage("AI is analysing and ranking candidates...");
          return current + 1;
        }

        return current;
      });
    }, 800);

      const formData = new FormData();

      formData.append("jobTitle", jobTitle);
      formData.append("jobDescription", jobDescription);

      files.forEach((file) => {
        formData.append("files", file);
      });

      console.log(
        "Files selected:",
        files.map((file) => file.name)
      );

      console.log("About to call /api/analyse");

      const progressInterval = setInterval(async () => {
  try {
    const res = await fetch("/api/analyse-status");
    const progress = await res.json();

    setCompleted(progress.completed || 0);
    setTotal(progress.total || 0);

  } catch (err) {
    console.error(err);
  }
}, 500);

      const response = await fetch("/api/analyse", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);

      const text = await response.text();

      console.log("Raw API response:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Server returned invalid response.");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyse CVs.");
      }

      clearInterval(progressInterval);

      setResults(data.results || []);
    } catch (err) {
      console.error("Analyse failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
  setLoading(false);
  setCompleted(0);
  setTotal(0);
}
  }
 
  return (
    <main className="page">
      <section className="card">
        <h1>AptivHire</h1>

        <p className="subtitle">
          Upload an applicant ZIP, CSV, or CV files and rank every
          candidate against the job description.
        </p>

        <label className="label">Job title</label>

        <input
          className="textInput"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Example: Senior Frontend Developer"
        />

        <label className="label">Job description</label>

        <textarea
          className="textarea"
          value={jobDescription}
          onChange={(e) =>
            setJobDescription(e.target.value)
          }
          placeholder="Paste the job description here..."
        />

        <label className="label">
          Upload applicant ZIP / CSV / CVs
        </label>

        <input
          type="file"
          multiple
          accept=".zip,.csv,.pdf,.doc,.docx"
          onChange={(event) => {
            const selected = Array.from(
              event.target.files || []
            );

            console.log(
              "Files picked:",
              selected.map((file) => file.name)
            );

            setFiles(selected);
            setResults([]);
            setError("");
          }}
          className="fileInput"
        />

        {files.length > 0 && (
          <div className="selectedBox">
            <strong>
              {files.length} files selected
            </strong>

            <ul>
              {files.map((file) => (
                <li key={file.name}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="button"
        >
          {loading
            ? "Ranking applicants..."
            : "Analyse & Rank CVs"}
        </button>

        {loading && (
  <div className="selectedBox">
    <strong>
      Analysed {completed} / {total} applicants
    </strong>

    <div
      style={{
        width: "100%",
        height: "12px",
        background: "#f3e6d8",
        borderRadius: "999px",
        overflow: "hidden",
        marginTop: "12px",
      }}
    >
      <div
        style={{
          width: `${total > 0 ? (completed / total) * 100 : 0}%`,
          height: "100%",
          background: "#e95b1f",
          transition: "width 0.3s ease",
        }}
      />
    </div>

    <p>
      {total > 0
        ? `${Math.round((completed / total) * 100)}% complete`
        : "Preparing analysis..."}
    </p>
  </div>
)}

        {error && (
          <div className="errorBox">{error}</div>
        )}

        {results.length > 0 && (
          <section className="results">
            <h2>Candidate Leaderboard</h2>

            <div className="leaderboard">
              {results.map((candidate, index) => (
                <article
                  key={candidate.fileName}
                  className="candidateCard"
                >
                  <div className="candidateTop">
                    <div>
                      <p className="rank">
                        #{index + 1}
                      </p>

                      <h3>
                        {candidate.candidateName}
                      </h3>

                      <p className="fileName">
                        {candidate.fileName}
                      </p>

                      {candidate.email && (
                        <p>{candidate.email}</p>
                      )}

                      {candidate.phone && (
                        <p>{candidate.phone}</p>
                      )}
                    </div>

                    <div
                      className="scoreBadge"
                      style={{
                        background: statusColor(
                          candidate.status
                        ),
                      }}
                    >
                      {candidate.score}/100
                    </div>
                  </div>

                  <p
                    className="statusText"
                    style={{
                      color: statusColor(
                        candidate.status
                      ),
                    }}
                  >
                    {candidate.status} —{" "}
                    {candidate.recommendation}
                  </p>

                  <p className="summary">
                    {candidate.summary}
                  </p>

                  <div className="skillsGrid">
                    <div>
                      <h4>Matched skills</h4>

                      <ul>
                        {candidate.matchedSkills.map(
                          (skill) => (
                            <li key={skill}>
                              {skill}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4>Missing skills</h4>

                      <ul>
                        {candidate.missingSkills.map(
                          (skill) => (
                            <li key={skill}>
                              {skill}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}