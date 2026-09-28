"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Listing = {
  id: number;
  title: string;
  price: number | string;
  location: string | null;
  category: string | null;
  description: string | null;
  image: string | null;
  images: string[] | null;
  promoted: boolean;
  promoted_until: string | null;
  created_at: string;
};

function SearchPageContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  const [listings, setListings] = useState<Listing[]>([]);
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    loadListings();
  }, [query, category]);

  async function loadListings() {
    try {
      setLoading(true);
      setError("");

      const supabase = createClient();

      let request = supabase
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
          promoted,
          promoted_until,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (category.trim()) {
        request = request.eq("category", category);
      }

      if (query.trim()) {
        const search = query.trim().replace(/,/g, " ");

        request = request.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%,location.ilike.%${search}%`
        );
      }

      const {
        data,
        error: listingsError,
      } = await request;

      if (listingsError) {
        console.error("Search error:", listingsError);

        setError(listingsError.message);
        setListings([]);
        return;
      }

      setListings((data || []) as Listing[]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load listings."
      );

      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  function isPromoted(listing: Listing) {
    if (
      !listing.promoted ||
      !listing.promoted_until
    ) {
      return false;
    }

    return (
      new Date(
        listing.promoted_until
      ).getTime() > Date.now()
    );
  }

  function getImage(listing: Listing) {
    if (
      Array.isArray(listing.images) &&
      listing.images.length > 0
    ) {
      return listing.images[0];
    }

    return listing.image;
  }

  function performSearch() {
    const value = searchInput.trim();

    if (!value) {
      window.location.href = "/";
      return;
    }

    window.location.href =
      `/search?q=${encodeURIComponent(value)}`;
  }

  function clearSearch() {
    window.location.href = "/";
  }

  const sortedListings = [...listings].sort(
    (a, b) => {
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
    }
  );

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">

      {/* HEADER */}

      <header className="bg-white border-b border-gray-300 sticky top-0 z-50">
        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">
          <div className="flex items-center gap-3">

            {/* LOGO */}

            <Link
              href="/"
              className="shrink-0 text-2xl sm:text-3xl font-black tracking-tight text-gray-950 hover:opacity-80 transition"
            >
              Sellio
            </Link>

            {/* SEARCH BAR */}

            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-2xl bg-white border border-gray-300 rounded-xl p-1 shadow-sm">
                <div className="flex items-center gap-1.5">

                  <span className="pl-2 text-gray-500 text-lg">
                    🔍
                  </span>

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
                    className="flex-1 min-w-0 bg-transparent px-2 py-2 outline-none text-sm"
                  />

                  <button
                    type="button"
                    onClick={performSearch}
                    className="shrink-0 bg-gray-950 hover:bg-black text-white px-5 py-2 rounded-lg font-bold text-sm transition"
                  >
                    Search
                  </button>

                </div>
              </div>
            </div>

            {/* ICONS */}

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              <Link
                href="/favourites"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 text-lg transition"
                title="Favourites"
              >
                ❤️
              </Link>

              <Link
                href="/messages"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 text-lg transition"
                title="Messages"
              >
                💬
              </Link>

              <Link
                href="/my-listings"
                className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold hover:bg-gray-200 text-sm transition"
              >
                📦
                <span>
                  My Listings
                </span>
              </Link>

              <Link
                href="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold hover:bg-gray-200 text-sm transition"
              >
                👤
                <span>
                  Profile
                </span>
              </Link>

              <Link
                href="/sell"
                className="bg-gray-950 hover:bg-black text-white px-3 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition"
              >
                + Sell
              </Link>

            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <section className="flex-1 w-full px-3 sm:px-5 lg:px-7 py-7">

        {/* TITLE */}

        <div className="flex items-end justify-between gap-4 mb-5">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500">
              Marketplace
            </p>

            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              {category
                ? category
                : "Search Results"}
            </h1>
          </div>

          {!loading && (
            <p className="text-sm text-gray-500">
              {sortedListings.length}{" "}
              {sortedListings.length === 1
                ? "listing"
                : "listings"}
            </p>
          )}

        </div>

        {/* SEARCH INFO */}

        {(query || category) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 mb-6">

            <p className="text-sm text-gray-600">

              {query && (
                <>
                  Results for{" "}

                  <span className="font-bold text-gray-900">
                    "{query}"
                  </span>
                </>
              )}

              {category && !query && (
                <>
                  Category:{" "}

                  <span className="font-bold text-gray-900">
                    {category}
                  </span>
                </>
              )}

            </p>

            <button
              type="button"
              onClick={clearSearch}
              className="text-sm font-bold hover:text-red-600"
            >
              Clear Search
            </button>

          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-6 bg-white border border-red-300 text-red-700 rounded-xl px-4 py-4">

            <p className="font-bold">
              Something went wrong
            </p>

            <p className="text-sm mt-1">
              {error}
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

        ) : sortedListings.length === 0 ? (

          /* NO RESULTS */

          <div className="bg-white border border-gray-300 rounded-2xl py-20 px-6 text-center">

            <div className="text-6xl">
              📦
            </div>

            <h2 className="text-2xl font-black mt-5">
              No listings found
            </h2>

            <p className="text-gray-500 mt-2">
              {query
                ? `We couldn't find any listings matching "${query}".`
                : "There are no listings in this category yet."}
            </p>

            <button
              type="button"
              onClick={clearSearch}
              className="mt-5 bg-gray-950 hover:bg-black text-white px-6 py-3 rounded-xl font-bold"
            >
              Back to Home
            </button>

          </div>

        ) : (

          /* LISTINGS */

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">

            {sortedListings.map(
              (listing) => {

                const promoted =
                  isPromoted(listing);

                const image =
                  getImage(listing);

                return (

                  <article
                    key={listing.id}
                    className={`bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition ${
                      promoted
                        ? "border-orange-300 hover:border-orange-500"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >

                    {/* IMAGE */}

                    <Link
                      href={`/listing?id=${encodeURIComponent(
                        String(listing.id)
                      )}`}
                      className="block relative"
                    >

                      {image ? (

                        <img
                          src={image}
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

                      {promoted && (

                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] uppercase tracking-wide font-black px-2.5 py-1 rounded-lg shadow">
                          🚀 Promoted
                        </span>

                      )}

                    </Link>

                    {/* DETAILS */}

                    <div className="p-3 sm:p-4">

                      {listing.category && (
                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 font-bold truncate">
                          {listing.category}
                        </p>
                      )}

                      <h2 className="font-black text-sm sm:text-base mt-1 line-clamp-2 min-h-[40px]">
                        {listing.title ||
                          "Untitled listing"}
                      </h2>

                      <p className="text-lg sm:text-xl font-black mt-2">
                        £
                        {Number(
                          listing.price || 0
                        ).toLocaleString("en-GB")}
                      </p>

                      {listing.location && (
                        <p className="text-xs text-gray-500 mt-1.5 truncate">
                          📍 {listing.location}
                        </p>
                      )}

                      <Link
                        href={`/listing?id=${encodeURIComponent(
                          String(listing.id)
                        )}`}
                        className="block mt-3 bg-gray-950 hover:bg-black text-white text-center py-2.5 rounded-xl text-xs sm:text-sm font-bold transition"
                      >
                        View Listing
                      </Link>

                    </div>

                  </article>

                );
              }
            )}

          </div>

        )}

      </section>

      {/* ADVERTISEMENT */}

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

      {/* FOOTER */}

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

              <Link
                href="/"
                className="hover:text-white transition"
              >
                Home
              </Link>

              <Link
                href="/sell"
                className="hover:text-white transition"
              >
                Sell
              </Link>

              <Link
                href="/my-listings"
                className="hover:text-white transition"
              >
                My Listings
              </Link>

              <Link
                href="/favourites"
                className="hover:text-white transition"
              >
                Favourites
              </Link>

              <Link
                href="/messages"
                className="hover:text-white transition"
              >
                Messages
              </Link>

              <Link
                href="/profile"
                className="hover:text-white transition"
              >
                Profile
              </Link>

            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100" />
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}