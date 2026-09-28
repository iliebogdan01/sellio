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

export default function FavouritesPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("sellio-listings");

    if (!saved) {
      return;
    }

    try {
      const allListings: Listing[] = JSON.parse(saved);

      const favouriteIds = JSON.parse(
        localStorage.getItem("sellio-favourites") || "[]"
      );

      const favouriteListings = allListings.filter((item) =>
        favouriteIds.includes(item.id)
      );

      setListings(favouriteListings);
    } catch {
      setListings([]);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">

      <header className="bg-white border-b">

        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <a
            href="/"
            className="text-3xl font-bold text-blue-600"
          >
            Sellio
          </a>

          <div className="flex gap-5">

            <a
              href="/"
              className="text-gray-600 hover:text-blue-600"
            >
              Home
            </a>

            <a
              href="/sell"
              className="text-gray-600 hover:text-blue-600"
            >
              Sell an item
            </a>

          </div>

        </div>

      </header>

      <section className="max-w-7xl mx-auto px-6 py-12">

        <h1 className="text-3xl font-bold">
          ❤️ Favourites
        </h1>

        <p className="text-gray-500 mt-2 mb-8">
          Your saved listings.
        </p>

        {listings.length === 0 ? (

          <div className="bg-white border rounded-2xl p-12 text-center">

            <div className="text-6xl">
              ❤️
            </div>

            <h2 className="text-2xl font-bold mt-5">
              No favourites yet
            </h2>

            <p className="text-gray-500 mt-2">
              Save listings you like and find them here.
            </p>

            <a
              href="/"
              className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Browse listings
            </a>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {listings.map((item) => (

              <a
                key={item.id}
                href={`/listing?id=${item.id}`}
                className="bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition"
              >

                {item.image ? (

                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-52 object-cover"
                  />

                ) : (

                  <div className="h-52 bg-gray-200 flex items-center justify-center">

                    <span className="text-6xl">
                      📷
                    </span>

                  </div>

                )}

                <div className="p-5">

                  <p className="text-xs text-blue-600 font-semibold">
                    {item.category}
                  </p>

                  <h3 className="font-semibold text-lg mt-2">
                    {item.title}
                  </h3>

                  <p className="text-2xl font-bold mt-3">
                    £{item.price.toLocaleString("en-GB")}
                  </p>

                  <p className="text-sm text-gray-500 mt-3">
                    📍 {item.location}
                  </p>

                </div>

              </a>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}