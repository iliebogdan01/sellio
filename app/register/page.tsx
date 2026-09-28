"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        setSuccess(
          "Account created successfully. Check your email if email confirmation is required."
        );

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setSuccess(
          "Account created. Please check your email to continue."
        );
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-gray-50/95 backdrop-blur border-b border-gray-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between">

            <Link
              href="/"
              className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950"
            >
              Sellio
            </Link>

            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold transition"
            >
              Login
            </Link>

          </div>

        </div>
      </header>

      {/* REGISTER */}
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10">

        <div className="w-full max-w-md">

          <div className="bg-white border border-gray-300 rounded-3xl p-6 sm:p-8 shadow-sm">

            {/* TITLE */}
            <div className="text-center mb-8">

              <p className="text-xs uppercase tracking-[0.2em] font-black text-gray-500">
                Sellio Marketplace
              </p>

              <h1 className="text-3xl sm:text-4xl font-black mt-3">
                Create account
              </h1>

              <p className="text-gray-500 mt-2">
                Join Sellio and start buying or selling.
              </p>

            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">

                <p className="font-bold text-sm">
                  Something went wrong
                </p>

                <p className="text-sm mt-1">
                  {error}
                </p>

              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">

                <p className="font-bold text-sm">
                  Success
                </p>

                <p className="text-sm mt-1">
                  {success}
                </p>

              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >

              {/* NAME */}
              <div>

                <label
                  htmlFor="name"
                  className="block text-sm font-black mb-2"
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={loading}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-gray-950 focus:outline-none transition disabled:opacity-60"
                />

              </div>

              {/* EMAIL */}
              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-black mb-2"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-gray-950 focus:outline-none transition disabled:opacity-60"
                />

              </div>

              {/* PASSWORD */}
              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-black mb-2"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-gray-950 focus:outline-none transition disabled:opacity-60"
                />

              </div>

              {/* CONFIRM PASSWORD */}
              <div>

                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-black mb-2"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-gray-950 focus:outline-none transition disabled:opacity-60"
                />

              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-950 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-black transition"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>

            {/* LOGIN */}
            <div className="border-t border-gray-200 mt-7 pt-6 text-center">

              <p className="text-sm text-gray-500">
                Already have an account?
              </p>

              <Link
                href="/login"
                className="inline-block mt-2 font-black text-gray-950 hover:underline"
              >
                Login →
              </Link>

            </div>

          </div>

          {/* HOME */}
          <div className="text-center mt-5">

            <Link
              href="/"
              className="text-sm font-bold text-gray-500 hover:text-gray-950"
            >
              ← Back to Sellio
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}