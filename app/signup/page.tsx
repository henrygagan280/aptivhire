"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Lock, Mail, User } from "lucide-react";
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
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[1fr_0.9fr]">
          <section className="hidden bg-slate-950 p-10 text-white lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
                N
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">Nuviq</p>
                <p className="text-xs font-semibold text-slate-400">
                  AI recruitment software
                </p>
              </div>
            </div>

            <div className="mt-20 max-w-md">
              <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                Create your workspace
              </p>

              <h1 className="text-5xl font-black leading-[1.02] tracking-[-0.055em]">
                Start hiring smarter with Nuviq.
              </h1>

              <p className="mt-5 text-base leading-7 text-slate-300">
                Analyse candidates, manage hiring pipelines and collaborate with
                your team from one clean recruitment workspace.
              </p>

              <div className="mt-10 space-y-4">
                <Feature text="AI-powered candidate screening" />
                <Feature text="Candidate ranking and hiring pipelines" />
                <Feature text="Team collaboration and interview scheduling" />
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Get started
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Create account
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Set up your Nuviq account and continue to plan selection.
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <InputField
                  label="Full name"
                  icon={<User size={17} />}
                  value={fullName}
                  onChange={setFullName}
                  required
                />

                <InputField
                  label="Company"
                  icon={<Building2 size={17} />}
                  value={company}
                  onChange={setCompany}
                />

                <InputField
                  label="Email"
                  type="email"
                  icon={<Mail size={17} />}
                  value={email}
                  onChange={setEmail}
                  required
                />

                <InputField
                  label="Password"
                  type="password"
                  icon={<Lock size={17} />}
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={6}
                />

                {errorMessage && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {errorMessage}
                  </p>
                )}

                {notice && (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-slate-950 hover:text-slate-700"
                >
                  Log in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InputField({
  label,
  icon,
  value,
  onChange,
  type = "text",
  required = false,
  minLength,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-slate-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100">
        <span className="text-slate-400">{icon}</span>

        <input
          type={type}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full border-none bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
        <CheckCircle2 size={17} />
      </div>
      <p className="text-sm font-semibold text-slate-200">{text}</p>
    </div>
  );
}