import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="card">
        <h1>AptivHire</h1>
        <p>AI-powered CV analysis for recruiters.</p>

        <Link href="/demo" className="button">
          Try Demo
        </Link>
      </section>
    </main>
  );
}