"use client";

import { useEffect, useState } from "react";

type Listing = {
  id: number;
  title: string;
  price: number;
  location: string;
  category: string;
  description: string;
  image?: string;
};

export default function ListingPage() {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    const saved = localStorage.getItem("sellio-listings");

    if (saved) {
      try {
        const listings: Listing[] = JSON.parse(saved);

        const found = listings.find(
          (item) => item.id === id
        );

        if (found) {
          setListing(found);

          const favourites = JSON.parse(
            localStorage.getItem("sellio-favourites") || "[]"
          );

          setIsFavourite(
            favourites.includes(found.id)
          );
        }
      } catch {
        console.log("Could not load listing.");
      }
    }

    setLoading(false);
  }, []);

  function toggleFavourite() {
    if (!listing) {
      return;
    }

    const saved = localStorage.getItem(
      "sellio-favourites"
    );

    let favourites: number[] = [];

    try {
      favourites = saved ? JSON.parse(saved) : [];
    } catch {
      favourites = [];
    }

    if (favourites.includes(listing.id)) {
      favourites = favourites.filter(
        (id) => id !== listing.id
      );

      setIsFavourite(false);
    } else {
      favourites.push(listing.id);

      setIsFavourite(true);
    }

    localStorage.setItem(
      "sellio-favourites",
      JSON.stringify(favourites)
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">
          Loading...
        </p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-gray-50">

        <header className="bg-white border-b">

          <div className="max-w-6xl mx-auto px-6 py-5">

            <a
              href="/"
              className="text-3xl font-bold text-blue-600"
            >
              Sellio
            </a>

          </div>

        </header>

        <section className="max-w-3xl mx-auto px-6 py-20 text-center">

          <div className="text-6xl">
            🔍
          </div>

          <h1 className="text-3xl font-bold mt-6">
            Listing not found
          </h1>

          <p className="text-gray-500 mt-3">
            This listing could not be found.
          </p>

          <a
            href="/"
            className="inline-block mt-8 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Back to Sellio
          </a>

        </section>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}

      <header className="bg-white border-b">

        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <a
            href="/"
            className="text-3xl font-bold text-blue-600"
          >
            Sellio
          </a>

          <div className="flex items-center gap-5">

            <a
              href="/favourites"
              className="text-gray-600 hover:text-blue-600 font-medium"
            >
              ❤️ Favourites
            </a>

            <a
              href="/"
              className="text-gray-600 hover:text-blue-600"
            >
              ← Back
            </a>

          </div>

        </div>

      </header>

      {/* LISTING */}

      <section className="max-w-6xl mx-auto px-6 py-10">

        <div className="grid md:grid-cols-2 gap-10">

          {/* PHOTO */}

          <div className="bg-white border rounded-2xl overflow-hidden">

            {listing.image ? (

              <img
                src={listing.image}
                alt={listing.title}
                className="w-full h-[500px] object-contain bg-gray-100"
              />

            ) : (

              <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center">

                <div className="text-center">

                  <div className="text-8xl">
                    📷
                  </div>

                  <p className="text-gray-500 mt-3">
                    No photo available
                  </p>

                </div>

              </div>

            )}

          </div>

          {/* DETAILS */}

          <div>

            <p className="text-blue-600 font-semibold">
              {listing.category}
            </p>

            <h1 className="text-4xl font-bold mt-3">
              {listing.title}
            </h1>

            <p className="text-4xl font-bold mt-6">
              £{listing.price.toLocaleString("en-GB")}
            </p>

            <p className="text-gray-500 mt-4">
              📍 {listing.location}
            </p>

            {/* DESCRIPTION */}

            <div className="border-t mt-8 pt-8">

              <h2 className="text-xl font-bold">
                Description
              </h2>

              <p className="text-gray-600 mt-4 leading-7 whitespace-pre-line">
                {listing.description}
              </p>

            </div>

            {/* MESSAGE */}

            <a
              href={`/messages?listing=${listing.id}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold mt-8 text-center"
            >
              💬 Message seller
            </a>

            {/* FAVOURITE */}

            <button
              type="button"
              onClick={toggleFavourite}
              className={`w-full py-4 rounded-xl font-semibold mt-3 border transition ${
                isFavourite
                  ? "bg-red-50 border-red-300 text-red-600"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {isFavourite
                ? "❤️ Remove from favourites"
                : "♡ Add to favourites"}
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}