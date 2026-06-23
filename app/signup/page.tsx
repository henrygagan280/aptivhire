"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token");

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setNotice("");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company,
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (inviteToken) {
      setNotice("Account created. Please sign in to accept your invite.");

      setTimeout(() => {
        router.push(`/login?invite_token=${inviteToken}`);
      }, 1000);

      return;
    }

    setNotice("Account created. Choose a plan to continue.");

    setTimeout(() => {
      router.push("/subscription");
    }, 1000);
  }

  return (
    <main className="min-h-screen bg-[#070A1A] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1025] p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Start using Nuviq with Supabase Auth.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="text-sm text-slate-300">Full name</label>
            <input
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-500"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Company</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-500"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-500"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {errorMessage && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </p>
          )}

          {notice && (
            <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-300 hover:text-violet-200">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}