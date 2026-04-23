"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

jsximport { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "missing_code"
      ? "Authentication callback failed. Please sign in again."
      : null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/auth/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, next: nextPath, remember }),
      });

      const data = (await response.json()) as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("Could not contact server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl bg-slate-900 p-8 text-slate-100">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">FinShield PK</p>
          <h1 className="mt-4 text-3xl font-semibold">Secure fraud intelligence platform</h1>
          <p className="mt-3 text-sm text-slate-300">
            Enterprise-grade transaction monitoring for modern banks with low-latency
            risk analysis.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <p className="text-xs text-slate-400">Detection latency</p>
              <p className="mt-2 text-xl font-semibold text-emerald-300">&lt; 120ms</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <p className="text-xs text-slate-400">Coverage</p>
              <p className="mt-2 text-xl font-semibold text-cyan-300">24/7 Monitoring</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Welcome back
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use your Supabase authentication account credentials.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-slate-400 transition focus:ring-2"
              placeholder="you@bank.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-slate-400 transition focus:ring-2"
              placeholder="Enter your password"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border border-slate-300 bg-white accent-slate-900"
            />
            Remember me on this device
          </label>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-center font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          </form>
        </section>
      </div>
    </main>
  );
}
