"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CancelPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-lg p-8 sm:p-12 text-center">

        <div className="text-6xl">
          ❌
        </div>

        <h1 className="text-3xl font-black mt-5">
          Payment cancelled
        </h1>

        <p className="text-gray-500 mt-3">
          The payment was cancelled.
          Your listing has not been promoted.
        </p>

        <p className="text-sm text-gray-400 mt-5">
          You will be redirected to Sellio
          in 5 seconds.
        </p>

        <Link
          href="/"
          className="block w-full mt-7 bg-gray-950 hover:bg-black text-white py-3.5 rounded-xl font-black transition"
        >
          ← Back to Sellio
        </Link>

        <Link
          href="/my-listings"
          className="block w-full mt-3 border-2 border-gray-200 hover:bg-gray-100 text-gray-900 py-3.5 rounded-xl font-black transition"
        >
          My Listings
        </Link>

      </div>

    </main>
  );
}