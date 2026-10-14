"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "iliebogdan01@yahoo.com";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage("Autentificare eșuată: " + error.message);
        return;
      }

      if (!data.session || !data.user) {
        setErrorMessage(
          "Autentificarea nu a creat o sesiune. Verifică utilizatorul în Supabase."
        );
        return;
      }

      const adminEmail = ADMIN_EMAIL.trim().toLowerCase();
      const loggedInEmail = data.user.email?.trim().toLowerCase();

      if (!loggedInEmail || loggedInEmail !== adminEmail) {
        await supabase.auth.signOut();
        setErrorMessage(
          "Contul conectat nu corespunde adresei autorizate pentru administrator."
        );
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "A apărut o eroare la conectare."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090a0b] p-6 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111315] p-8 shadow-2xl"
      >
        <a href="/" className="mb-8 inline-block text-3xl font-black">
          sellio<span className="text-[#c6ff00]">.</span>
        </a>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#c6ff00]">
          Administrator
        </p>

        <h1 className="mb-3 text-3xl font-black">Conectare</h1>

        <p className="mb-8 leading-6 text-white/55">
          Conectează-te cu adresa autorizată pentru panoul Sellio.
        </p>

        <label htmlFor="email" className="mb-2 block text-sm font-semibold">
          Adresă de e-mail
        </label>

        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mb-5 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white outline-none focus:border-[#c6ff00]"
          placeholder="Email"
        />

        <label htmlFor="password" className="mb-2 block text-sm font-semibold">
          Parolă
        </label>

        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="mb-5 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white outline-none focus:border-[#c6ff00]"
          placeholder="Parolă"
        />

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm leading-6 text-red-300"
          >
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#c6ff00] p-3 font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Se conectează..." : "Conectare"}
        </button>

        <a
          href="/"
          className="mt-6 block text-center text-sm text-white/50 hover:text-[#c6ff00]"
        >
          ← Înapoi la pagina principală
        </a>
      </form>
    </main>
  );
}