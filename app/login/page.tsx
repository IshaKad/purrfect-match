
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError || !data.user) {
        setError(loginError?.message || 'Unable to sign in.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (
        profileError ||
        !profile ||
        !['admin', 'coordinator'].includes(profile.role)
      ) {
        await supabase.auth.signOut();
        setError('This account does not have staff access.');
        return;
      }

      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-16">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm font-semibold text-[#e56c4b]"
        >
          ← Back to Purrfect Match
        </Link>

        <section className="mt-8 rounded-3xl border border-[#f0e5d8] bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#e56c4b]">
            Staff portal
          </p>

          <h1 className="mt-3 text-3xl font-black text-[#302923]">
            Welcome back.
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#74685e]">
            Sign in to manage rescue reports, cat profiles,
            and adoption applications.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#302923]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#e8ddd1] bg-[#fffdf9] px-4 py-3 outline-none focus:border-[#e56c4b]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[#302923]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#e8ddd1] bg-[#fffdf9] px-4 py-3 outline-none focus:border-[#e56c4b]"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#e56c4b] px-4 py-3 font-bold text-white transition hover:bg-[#cf5739] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in to dashboard'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
