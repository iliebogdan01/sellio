"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";
import MessageBadge from "../components/MessageBadge";

type Listing = {
  id: number;
  title: string;
  price: number | string;
  location: string | null;
  category: string | null;
  description: string | null;
  image: string | null;
  images: string[] | null;
  user_id: string;
  created_at: string;
  promoted: boolean;
  promoted_until: string | null;
};

const categories = [
  { name: "All", icon: "✨" },
  { name: "Cars & Vehicles", icon: "🚗" },
  { name: "Property", icon: "🏠" },
  { name: "Electronics", icon: "📱" },
  { name: "Fashion", icon: "👕" },
  { name: "Home & Garden", icon: "🛋️" },
  { name: "Gaming", icon: "🎮" },
  { name: "Baby & Kids", icon: "🧸" },
  { name: "Services", icon: "🔧" },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    try {
      setLoading(true);
      setErrorMessage("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          title,
          price,
          location,
          category,
          description,
          image,
          images,
          user_id,
          created_at,
          promoted,
          promoted_until
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Could not load listings:", error);

        setErrorMessage(
          error.message || "Could not load listings."
        );

        setListings([]);
        return;
      }

      setListings((data || []) as Listing[]);
    } catch (error) {
      console.error("Load listings error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading listings."
      );

      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  function isPromoted(listing: Listing) {
    if (!listing.promoted || !listing.promoted_until) {
      return false;
    }

    return (
      new Date(listing.promoted_until).getTime() >
      Date.now()
    );
  }

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matchingListings = listings.filter((listing) => {
      const title = String(
        listing.title || ""
      ).toLowerCase();

      const location = String(
        listing.location || ""
      ).toLowerCase();

      const listingCategory = String(
        listing.category || ""
      ).toLowerCase();

      const description = String(
        listing.description || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        location.includes(query) ||
        listingCategory.includes(query) ||
        description.includes(query);

      const matchesCategory =
        category === "All" ||
        listing.category === category;

      return matchesSearch && matchesCategory;
    });

    return [...matchingListings].sort((a, b) => {
      const aPromoted = isPromoted(a);
      const bPromoted = isPromoted(b);

      if (aPromoted && !bPromoted) {
        return -1;
      }

      if (!aPromoted && bPromoted) {
        return 1;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [listings, search, category]);

  function performSearch() {
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setCategory("All");
  }

  function goToListing(id: number | string) {
    window.location.href = `/listing?id=${encodeURIComponent(
      String(id)
    )}`;
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">

      {/* HEADER */}

      <header className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          {/* TOP ROW */}

          <div className="flex items-center justify-between gap-2">

            {/* LOGO */}

            <a
              href="/"
              className="shrink-0 text-2xl sm:text-3xl font-black tracking-tight text-gray-950 hover:scale-105 transition-transform"
            >
              Sellio
            </a>

            {/* RIGHT BUTTONS */}

            <div className="flex items-center gap-1 sm:gap-2">

              {/* FAVOURITES */}

              <a
                href="/favourites"
                className="group w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
                title="Favourites"
                aria-label="Favourites"
              >
                <span className="text-lg group-hover:scale-125 transition-transform">
                  ❤️
                </span>
              </a>

              {/* MESSAGES */}

              <MessageBadge />

              {/* MY LISTINGS */}

              <a
                href="/my-listings"
                className="group flex items-center justify-center gap-2 w-9 h-9 sm:w-auto sm:h-10 sm:px-3 rounded-xl font-semibold hover:bg-gray-100 text-sm transition"
                title="My Listings"
                aria-label="My Listings"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">
                  📦
                </span>

                <span className="hidden sm:inline">
                  My Listings
                </span>
              </a>

              {/* PROFILE */}

              <a
                href="/profile"
                className="group flex items-center justify-center gap-2 w-9 h-9 sm:w-auto sm:h-10 sm:px-3 rounded-xl font-semibold hover:bg-gray-100 text-sm transition"
                title="Profile"
                aria-label="Profile"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">
                  👤
                </span>

                <span className="hidden sm:inline">
                  Profile
                </span>
              </a>

              {/* SELL */}

              <a
                href="/sell"
                className="flex items-center justify-center bg-gray-950 hover:bg-black text-white w-9 h-9 sm:w-auto sm:h-10 sm:px-5 rounded-xl font-bold text-sm transition hover:scale-[1.02] active:scale-95"
                title="Sell"
                aria-label="Sell"
              >
                <span className="sm:hidden text-lg">
                  +
                </span>

                <span className="hidden sm:inline">
                  + Sell
                </span>
              </a>

            </div>

          </div>

          {/* SEARCH ROW */}

          <div className="mt-3 w-full">

            <div className="w-full bg-white border-2 border-gray-300 focus-within:border-gray-950 rounded-2xl p-1 shadow-sm transition">

              <div className="flex items-center gap-1.5">

                {/* SEARCH ICON */}

                <div className="flex w-10 h-10 items-center justify-center text-gray-500 shrink-0">
                  🔍
                </div>

                {/* SEARCH INPUT */}

                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      performSearch();
                    }
                  }}
                  placeholder="What are you looking for?"
                  className="flex-1 min-w-0 bg-transparent px-2 py-2.5 outline-none text-sm"
                />

                {/* CATEGORY SELECT */}

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="hidden lg:block w-44 bg-gray-100 border border-gray-300 rounded-xl px-2 py-2.5 outline-none text-sm font-semibold"
                >
                  {categories.map((item) => (
                    <option
                      key={item.name}
                      value={item.name}
                    >
                      {item.icon} {item.name}
                    </option>
                  ))}
                </select>

                {/* SEARCH BUTTON */}

                <button
                  type="button"
                  onClick={performSearch}
                  className="shrink-0 bg-gray-950 hover:bg-black text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition hover:scale-[1.02] active:scale-95"
                >
                  Search
                </button>

              </div>

            </div>

          </div>

        </div>

      </header>

      {/* PAGE */}

      <div className="flex-1">

        {/* TOP AD */}

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

        {/* CATEGORIES */}

        <section className="bg-white border-b border-gray-300">

          <div className="w-full px-3 sm:px-5 lg:px-7 py-4">

            <div className="flex gap-3 overflow-x-auto pb-1">

              {categories.map((item) => {
                const active = category === item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCategory(item.name)}
                    className={`group shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      active
                        ? "bg-gray-950 text-white shadow-md scale-[1.02]"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-0.5"
                    }`}
                  >
                    <span className="text-lg transition-transform duration-200 group-hover:scale-125 group-hover:rotate-3">
                      {item.icon}
                    </span>

                    <span>
                      {item.name}
                    </span>
                  </button>
                );
              })}

            </div>

          </div>

        </section>

        {/* LISTINGS */}

        <section className="w-full px-3 sm:px-5 lg:px-7 py-7">

          <div className="flex items-end justify-between gap-4 mb-5">

            <div>

              <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500">
                Marketplace
              </p>

              <h2 className="text-2xl sm:text-3xl font-black mt-1">
                {search || category !== "All"
                  ? "Listings"
                  : "Latest Listings"}
              </h2>

            </div>

            <p className="text-sm text-gray-500">
              {filteredListings.length}{" "}
              {filteredListings.length === 1
                ? "listing"
                : "listings"}
            </p>

          </div>

          {/* SEARCH RESULT */}

          {(search || category !== "All") && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-200 border border-gray-300 rounded-xl px-4 py-3 mb-5">

              <p className="text-sm text-gray-600">

                {search && (
                  <>
                    Results for{" "}
                    <span className="font-bold text-gray-950">
                      "{search}"
                    </span>
                  </>
                )}

                {!search && category !== "All" && (
                  <>
                    Category:{" "}
                    <span className="font-bold text-gray-950">
                      {category}
                    </span>
                  </>
                )}

              </p>

              <button
                type="button"
                onClick={clearSearch}
                className="text-sm font-bold text-gray-700 hover:text-red-600 transition"
              >
                Clear
              </button>

            </div>
          )}

          {/* ERROR */}

          {errorMessage && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">

              <p className="font-bold">
                Could not load listings
              </p>

              <p className="text-sm mt-1">
                {errorMessage}
              </p>

            </div>
          )}

          {/* LOADING */}

          {loading ? (
            <div className="bg-white border border-gray-300 rounded-2xl py-20 text-center">

              <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-950 rounded-full animate-spin mx-auto" />

              <p className="text-gray-500 mt-4">
                Loading listings...
              </p>

            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white border border-gray-300 rounded-2xl py-20 px-6 text-center">

              <div className="text-6xl">
                📦
              </div>

              <h3 className="text-2xl font-black mt-5">
                No listings found
              </h3>

              <p className="text-gray-500 mt-2">

                {search
                  ? `No listing matches "${search}".`
                  : category !== "All"
                  ? `There are no listings in ${category}.`
                  : "There are currently no listings."}

              </p>

              {(search || category !== "All") && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-5 bg-gray-950 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition"
                >
                  Clear Search
                </button>
              )}

            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">

              {filteredListings.map((listing) => {

                const promoted = isPromoted(listing);

                return (
                  <article
                    key={listing.id}
                    className={`group bg-white border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${
                      promoted
                        ? "border-orange-300 hover:border-orange-500"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >

                    {/* IMAGE */}

                    <button
                      type="button"
                      onClick={() => goToListing(listing.id)}
                      className="block relative w-full text-left overflow-hidden"
                    >

                      {listing.image ? (
                        <img
                          src={listing.image}
                          alt={listing.title || "Listing"}
                          className="w-full h-40 sm:h-48 lg:h-52 object-cover group-hover:scale-[1.04] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-40 sm:h-48 lg:h-52 bg-gray-200 flex items-center justify-center text-5xl">
                          📷
                        </div>
                      )}

                      {promoted && (
                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] uppercase tracking-wide font-black px-2.5 py-1 rounded-lg shadow">
                          🚀 Promoted
                        </span>
                      )}

                    </button>

                    {/* INFO */}

                    <div className="p-3 sm:p-4">

                      {listing.category && (
                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 font-bold truncate">
                          {listing.category}
                        </p>
                      )}

                      <h3 className="font-black text-sm sm:text-base mt-1 line-clamp-2 min-h-[40px]">
                        {listing.title || "Untitled listing"}
                      </h3>

                      <p className="text-lg sm:text-xl font-black mt-2">
                        £
                        {Number(listing.price || 0).toLocaleString(
                          "en-GB"
                        )}
                      </p>

                      {listing.location && (
                        <p className="text-xs text-gray-500 mt-1.5 truncate">
                          📍 {listing.location}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => goToListing(listing.id)}
                        className="w-full mt-3 bg-gray-950 hover:bg-black text-white text-center py-2.5 rounded-xl text-xs sm:text-sm font-bold transition hover:scale-[1.01] active:scale-95"
                      >
                        View Listing
                      </button>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* SELL CTA */}

        <section className="w-full px-3 sm:px-5 lg:px-7 pb-8">

          <div className="bg-gray-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">

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
              className="bg-white text-gray-950 hover:bg-gray-200 px-6 py-3 rounded-xl font-black transition hover:scale-[1.02]"
            >
              + Create Listing
            </a>

          </div>

        </section>

        {/* BOTTOM AD */}

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

      </div>

      {/* FOOTER */}

      <footer className="mt-auto bg-gray-950 text-gray-400">

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

              <a href="/" className="hover:text-white transition">
                Home
              </a>

              <a href="/sell" className="hover:text-white transition">
                Sell
              </a>

              <a href="/my-listings" className="hover:text-white transition">
                My Listings
              </a>

              <a href="/favourites" className="hover:text-white transition">
                Favourites
              </a>

              <a href="/messages" className="hover:text-white transition">
                Messages
              </a>

              <a href="/profile" className="hover:text-white transition">
                Profile
              </a>

            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}