"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("sellio-name");
    const savedEmail = localStorage.getItem("sellio-email");

    if (savedName) {
      setName(savedName);
    }

    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  function saveProfile() {
    localStorage.setItem("sellio-name", name);
    localStorage.setItem("sellio-email", email);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-white border-b">

        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="text-3xl font-bold text-blue-600"
          >
            Sellio
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold"
          >
            ← Home
          </button>

        </div>

      </header>

      <section className="max-w-2xl mx-auto px-6 py-12">

        <div className="bg-white border rounded-2xl shadow-sm p-8">

          <div className="text-center">

            <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-5xl">
              👤
            </div>

            <h1 className="text-3xl font-bold mt-5">
              My Profile
            </h1>

            <p className="text-gray-500 mt-2">
              Manage your Sellio profile
            </p>

          </div>

          <div className="mt-8">

            <label className="block font-semibold mb-2">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

          </div>

          <div className="mt-5">

            <label className="block font-semibold mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="your@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

          </div>

          <button
            type="button"
            onClick={saveProfile}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
          >
            Save Profile
          </button>

          {saved && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-center">
              ✓ Profile saved
            </div>
          )}

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-white border rounded-xl p-5 hover:border-blue-500"
          >
            <div className="text-3xl">
              🏠
            </div>

            <p className="font-semibold mt-2">
              Home
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/my-listings";
            }}
            className="bg-white border rounded-xl p-5 hover:border-blue-500"
          >
            <div className="text-3xl">
              📦
            </div>

            <p className="font-semibold mt-2">
              My Listings
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/favourites";
            }}
            className="bg-white border rounded-xl p-5 hover:border-red-400"
          >
            <div className="text-3xl">
              ❤️
            </div>

            <p className="font-semibold mt-2">
              Favourites
            </p>
          </button>

        </div>

      </section>

    </main>
  );
}