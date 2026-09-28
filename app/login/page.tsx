"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
        return;
      }

      setChecking(false);
    }

    checkExistingSession();
  }, [router]);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Please enter your email.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        console.error("Supabase login error:", error);

        setMessage(
          error.message || "Incorrect email or password."
        );

        setLoading(false);
        return;
      }

      if (!data.session) {
        setMessage(
          "Login succeeded, but no session was created."
        );

        setLoading(false);
        return;
      }

      console.log(
        "LOGIN SUCCESS:",
        data.user.email
      );

      /*
       * Give Supabase a moment to finish writing
       * the authentication session before navigating.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Login exception:", error);

      setMessage(
        "Something went wrong while signing in."
      );

      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-[#111111] text-white flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-[#333333] border-t-white rounded-full animate-spin mx-auto" />

          <p className="text-[#999999] mt-4">
            Checking session...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white flex flex-col">

      <header className="border-b border-[#2a2a2a] bg-[#0b0b0b]">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">

          <a
            href="/"
            className="text-3xl font-black text-white tracking-tight"
          >
            Sellio
          </a>

        </div>

      </header>

      <section className="flex-1 flex items-center justify-center px-4 py-10">

        <div className="w-full max-w-md">

          <div className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-7 sm:p-8 shadow-2xl">

            <h1 className="text-3xl font-black">
              Welcome back
            </h1>

            <p className="text-[#999999] mt-2">
              Sign in to your Sellio account.
            </p>

            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-5"
            >

              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-bold mb-2"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full bg-[#111111] border border-[#3a3a3a] text-white placeholder-[#666666] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                />

              </div>

              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-bold mb-2"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Your password"
                  disabled={loading}
                  className="w-full bg-[#111111] border border-[#3a3a3a] text-white placeholder-[#666666] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                />

              </div>

              {message && (
                <div className="bg-[#2a1515] border border-[#553333] text-[#ffb3b3] rounded-xl px-4 py-3 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-gray-200 text-black py-4 rounded-xl font-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>

            </form>

            <p className="text-center text-[#999999] mt-6">

              Don't have an account?{" "}

              <a
                href="/register"
                className="text-white font-bold hover:underline"
              >
                Create account
              </a>

            </p>

          </div>

        </div>

      </section>

    </main>
  );
}