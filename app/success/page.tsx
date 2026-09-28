"use client";

import { useEffect } from "react";

export default function PaymentSuccessPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="bg-white border border-gray-200 rounded-3xl shadow-lg p-8 sm:p-12 max-w-lg w-full text-center">

        <div className="text-6xl">
          ✅
        </div>

        <h1 className="text-3xl font-black mt-5">
          Payment successful!
        </h1>

        <p className="text-gray-500 mt-3">
          Your listing promotion payment was completed successfully.
        </p>

        <p className="text-sm text-gray-400 mt-5">
          You will be redirected to the home page in 5 seconds.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="w-full mt-7 bg-black text-white py-3.5 rounded-xl font-black hover:bg-gray-800 transition"
        >
          Go to Home
        </button>

      </div>

    </main>
  );
}