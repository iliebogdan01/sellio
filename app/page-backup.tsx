"use client";

import { useEffect, useMemo, useState } from "react";

type Listing = {
  id: number | string;
  title: string;
  price: number | string;
  location?: string;
  category?: string;
  description?: string;
  image?: string;
  userEmail?: string;
  promoted?: boolean;
  promotedUntil?: string;
};

const categories = [
  "All",
  "Cars & Vehicles",
  "Property",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Gaming",
  "Baby & Kids",
  "Services",
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD LISTINGS
  ========================= */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "sellio-listings"
        );

      if (saved) {
        const data = JSON.parse(saved);

        if (Array.isArray(data)) {
          setListings(data);
        }
      }
    } catch {
      setListings([]);
    }

    setLoading(false);
  }, []);

  /* =========================
     CHECK PROMOTION
  ========================= */

  function isPromoted(listing: Listing) {
    if (
      !listing.promoted ||
      !listing.promotedUntil
    ) {
      return false;
    }

    return (
      new Date(
        listing.promotedUntil
      ).getTime() > Date.now()
    );
  }

  /* =========================
     FILTER + SORT
  ========================= */

  const filteredListings = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const matchingListings =
      listings.filter((listing) => {
        const matchesSearch =
          !query ||
          String(listing.title || "")
            .toLowerCase()
            .includes(query) ||
          String(listing.location || "")
            .toLowerCase()
            .includes(query) ||
          String(listing.category || "")
            .toLowerCase()
            .includes(query) ||
          String(listing.description || "")
            .toLowerCase()
            .includes(query);

        const matchesCategory =
          category === "All" ||
          listing.category === category;

        return (
          matchesSearch &&
          matchesCategory
        );
      });

    /*
     * IMPORTANT:
     *
     * No search/category:
     * show ONLY promoted listings.
     *
     * Search/category:
     * show ALL matching listings,
     * but promoted listings come first.
     */

    const hasFilter =
      Boolean(search.trim()) ||
      category !== "All";

    if (!hasFilter) {
      return matchingListings.filter(
        (listing) =>
          isPromoted(listing)
      );
    }

    return [...matchingListings].sort(
      (a, b) => {
        const aPromoted =
          isPromoted(a);

        const bPromoted =
          isPromoted(b);

        if (
          aPromoted &&
          !bPromoted
        ) {
          return -1;
        }

        if (
          !aPromoted &&
          bPromoted
        ) {
          return 1;
        }

        return 0;
      }
    );
  }, [
    listings,
    search,
    category,
  ]);

  /* =========================
     SEARCH
  ========================= */

  function performSearch() {
    setSearch(
      searchInput.trim()
    );
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setCategory("All");
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* =========================
          HEADER
      ========================= */}

      <header className="bg-gray-50 border-b border-gray-300 sticky top-0 z-50">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          <div className="flex items-center gap-3">

            {/* LOGO */}

            <a
              href="/"
              className="shrink-0 text-2xl sm:text-3xl font-black tracking-tight text-gray-950"
            >
              Sellio
            </a>

            {/* SEARCH */}

            <div className="flex-1 flex justify-center">

              <div className="w-full max-w-2xl bg-gray-50 border border-gray-300 rounded-xl p-1 shadow-sm">

                <div className="flex items-center gap-1.5">

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) =>
                      setSearchInput(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        performSearch();
                      }
                    }}
                    placeholder="What are you looking for?"
                    className="flex-1 min-w-0 bg-transparent px-3 py-2 outline-none text-sm"
                  />

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value
                      )
                    }
                    className="hidden md:block w-40 bg-gray-100 border border-gray-300 rounded-lg px-2 py-2 outline-none text-sm font-semibold"
                  >

                    {categories.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

                  </select>

                  <button
                    type="button"
                    onClick={
                      performSearch
                    }
                    className="shrink-0 bg-gray-950 hover:bg-black text-white px-5 py-2 rounded-lg font-bold text-sm transition"
                  >
                    Search
                  </button>

                </div>

              </div>

            </div>

            {/* ACCOUNT BUTTONS */}

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              <a
                href="/favourites"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 text-lg transition"
                title="Favourites"
              >
                ❤️
              </a>

              <a
                href="/messages"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 text-lg transition"
                title="Messages"
              >
                💬
              </a>

              <a
                href="/my-listings"
                className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold hover:bg-gray-200 text-sm transition"
              >
                📦
                <span>
                  My Listings
                </span>
              </a>

              <a
                href="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold hover:bg-gray-200 text-sm transition"
              >
                👤
                <span>
                  Profile
                </span>
              </a>

              <a
                href="/sell"
                className="bg-gray-950 hover:bg-black text-white px-3 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition"
              >
                + Sell
              </a>

            </div>

          </div>

        </div>

      </header>

      {/* =========================
          TOP AD
      ========================= */}

      <section className="bg-gray-200 border-b border-gray-300">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          <div className="bg-gray-300 border border-gray-400 rounded-xl h-20 flex items-center justify-center text-center">

            <div>

              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-500">
                Advertisement
              </p>

              <p className="text-gray-600 text-xs font-semibold mt-1">
                Your advertisement could appear here
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          CATEGORIES
      ========================= */}

      <section className="bg-gray-50 border-b border-gray-300">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          <div className="flex gap-2 overflow-x-auto">

            {categories.map(
              (item) => (

                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setCategory(item)
                  }
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    category === item
                      ? "bg-gray-950 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  {item}
                </button>

              )
            )}

          </div>

        </div>

      </section>

      {/* =========================
          LISTINGS
      ========================= */}

      <section className="w-full px-3 sm:px-5 lg:px-7 py-7">

        <div className="flex items-end justify-between gap-4 mb-5">

          <div>

            <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500">

              {search ||
              category !== "All"
                ? "Marketplace"
                : "Promoted"}

            </p>

            <h2 className="text-2xl sm:text-3xl font-black mt-1">

              {search ||
              category !== "All"
                ? "Listings"
                : "Featured Listings"}

            </h2>

          </div>

          <p className="text-sm text-gray-500">

            {filteredListings.length}{" "}

            {filteredListings.length ===
            1
              ? "listing"
              : "listings"}

          </p>

        </div>

        {/* SEARCH RESULTS */}

        {search && (

          <div className="flex items-center justify-between bg-gray-200 border border-gray-300 rounded-xl px-4 py-3 mb-5">

            <p className="text-sm text-gray-600">

              Results for{" "}

              <span className="font-bold text-gray-900">
                "{search}"
              </span>

            </p>

            <button
              type="button"
              onClick={
                clearSearch
              }
              className="text-sm font-bold hover:text-red-600"
            >
              Clear
            </button>

          </div>

        )}

        {/* LOADING */}

        {loading ? (

          <div className="bg-gray-50 border border-gray-300 rounded-2xl py-20 text-center">

            <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-950 rounded-full animate-spin mx-auto" />

            <p className="text-gray-500 mt-4">
              Loading listings...
            </p>

          </div>

        ) : filteredListings.length ===
          0 ? (

          <div className="bg-gray-50 border border-gray-300 rounded-2xl py-20 px-6 text-center">

            <div className="text-6xl">
              {search ||
              category !== "All"
                ? "📦"
                : "🚀"}
            </div>

            <h3 className="text-2xl font-black mt-5">

              {search ||
              category !== "All"
                ? "No listings found"
                : "No promoted listings"}

            </h3>

            <p className="text-gray-500 mt-2">

              {search ||
              category !== "All"
                ? "Try another search or category."
                : "Promoted listings will appear here."}

            </p>

            {(search ||
              category !== "All") && (

              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="mt-5 bg-gray-950 hover:bg-black text-white px-6 py-3 rounded-xl font-bold"
              >
                Clear Search
              </button>

            )}

          </div>

        ) : (

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">

            {filteredListings.map(
              (listing) => {

                const promoted =
                  isPromoted(
                    listing
                  );

                return (
                  <article
                    key={listing.id}
                    className={`bg-gray-50 border rounded-2xl overflow-hidden hover:shadow-lg transition ${
                      promoted
                        ? "border-orange-300 hover:border-orange-500"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >

                    {/* IMAGE */}

                    <a
                      href={`/listing?id=${encodeURIComponent(
                        String(
                          listing.id
                        )
                      )}`}
                      className="block relative"
                    >

                      {listing.image ? (

                        <img
                          src={
                            listing.image
                          }
                          alt={
                            listing.title ||
                            "Listing"
                          }
                          className="w-full h-40 sm:h-48 lg:h-52 object-cover"
                        />

                      ) : (

                        <div className="w-full h-40 sm:h-48 lg:h-52 bg-gray-200 flex items-center justify-center text-5xl">
                          📷
                        </div>

                      )}

                      {/* PROMOTED BADGE */}

                      {promoted && (

                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] uppercase tracking-wide font-black px-2.5 py-1 rounded-lg shadow">
                          🚀 Promoted
                        </span>

                      )}

                    </a>

                    {/* DETAILS */}

                    <div className="p-3 sm:p-4">

                      {listing.category && (

                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 font-bold truncate">
                          {listing.category}
                        </p>

                      )}

                      <h3 className="font-black text-sm sm:text-base mt-1 line-clamp-2 min-h-[40px]">
                        {listing.title ||
                          "Untitled listing"}
                      </h3>

                      <p className="text-lg sm:text-xl font-black mt-2">
                        £
                        {Number(
                          listing.price ||
                            0
                        ).toLocaleString(
                          "en-GB"
                        )}
                      </p>

                      {listing.location && (

                        <p className="text-xs text-gray-500 mt-1.5 truncate">
                          📍{" "}
                          {
                            listing.location
                          }
                        </p>

                      )}

                      <a
                        href={`/listing?id=${encodeURIComponent(
                          String(
                            listing.id
                          )
                        )}`}
                        className="block mt-3 bg-gray-950 hover:bg-black text-white text-center py-2.5 rounded-xl text-xs sm:text-sm font-bold transition"
                      >
                        View Listing
                      </a>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </section>

      {/* =========================
          SELL CTA
      ========================= */}

      <section className="w-full px-3 sm:px-5 lg:px-7 pb-8">

        <div className="bg-gray-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">

          <div>

            <p className="text-xl sm:text-2xl font-black">
              Have something to sell?
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Create a listing and promote it to get more visibility.
            </p>

          </div>

          <a
            href="/sell"
            className="bg-white text-gray-950 hover:bg-gray-200 px-6 py-3 rounded-xl font-black transition"
          >
            + Create Listing
          </a>

        </div>

      </section>

      {/* =========================
          BOTTOM AD
      ========================= */}

      <section className="w-full px-3 sm:px-5 lg:px-7 pb-8">

        <div className="bg-gray-300 border border-gray-400 rounded-xl h-24 sm:h-28 flex items-center justify-center text-center">

          <div>

            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-500">
              Advertisement
            </p>

            <p className="text-gray-600 text-xs font-semibold mt-1">
              Your advertisement could appear here
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="bg-gray-950 text-gray-400">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-7">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="text-center sm:text-left">

              <p className="text-white font-black text-xl">
                Sellio
              </p>

              <p className="text-xs mt-1">
                Buy. Sell. Discover.
              </p>

            </div>

            <div className="flex flex-wrap justify-center gap-5 text-sm">

              <a
                href="/"
                className="hover:text-white transition"
              >
                Home
              </a>

              <a
                href="/sell"
                className="hover:text-white transition"
              >
                Sell
              </a>

              <a
                href="/my-listings"
                className="hover:text-white transition"
              >
                My Listings
              </a>

              <a
                href="/favourites"
                className="hover:text-white transition"
              >
                Favourites
              </a>

              <a
                href="/messages"
                className="hover:text-white transition"
              >
                Messages
              </a>

              <a
                href="/profile"
                className="hover:text-white transition"
              >
                Profile
              </a>

            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}