
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "iliebogdan01@yahoo.com";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Adresa de e-mail sau parola sunt incorecte."
            : error.message
        );
        return;
      }

      if (!data.user) {
        setErrorMessage("Autentificarea nu a returnat un utilizator.");
        return;
      }

      const loggedInEmail = data.user.email?.trim().toLowerCase();

      if (loggedInEmail !== ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut();
        setErrorMessage(
          "Contul conectat nu corespunde adresei autorizate pentru administrator."
        );
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMessage(
        "A apărut o eroare la conectare. Încearcă din nou."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111111] px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1b1b1b] p-6 shadow-2xl sm:p-8">
        <a
          href="/"
          className="mb-8 inline-block text-2xl font-black tracking-tight"
        >
          Sellio<span className="text-orange-500">.</span>
        </a>

        <h1 className="mb-3 text-3xl font-black">
          Conectare administrator
        </h1>

        <p className="mb-8 leading-6 text-white/60">
          Conectează-te cu adresa autorizată pentru panoul de administrare Sellio.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold"
            >
              Adresă de e-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Adresa de e-mail"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold"
            >
              Parolă
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Parola contului"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-orange-500"
            />
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Se conectează..." : "Conectare"}
          </button>
        </form>

        <a
          href="/"
          className="mt-6 block text-center text-sm text-white/60 transition hover:text-white"
        >
          Înapoi la Sellio
        </a>
      </div>
    </main>
  );
}