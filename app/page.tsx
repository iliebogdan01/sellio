"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  const [favourites, setFavourites] = useState<number[]>([]);

  useEffect(() => {
    loadListings();
    loadFavourites();
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

  async function loadFavourites() {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFavourites([]);
        return;
      }

      const { data, error } = await supabase
        .from("favourites")
        .select("listing_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Could not load favourites:", error);
        return;
      }

      setFavourites(
        (data || []).map(
          (item: { listing_id: number }) =>
            Number(item.listing_id)
        )
      );
    } catch (error) {
      console.error("Favourite loading error:", error);
    }
  }

  async function toggleFavourite(
    event: React.MouseEvent<HTMLButtonElement>,
    listingId: number
  ) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const isFavourite = favourites.includes(listingId);

      if (isFavourite) {
        const { error } = await supabase
          .from("favourites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) {
          console.error(error);
          return;
        }

        setFavourites((current) =>
          current.filter((id) => id !== listingId)
        );
      } else {
        const { error } = await supabase
          .from("favourites")
          .insert({
            user_id: user.id,
            listing_id: listingId,
          });

        if (error) {
          console.error(error);
          return;
        }

        setFavourites((current) => [
          ...current,
          listingId,
        ]);
      }
    } catch (error) {
      console.error("Favourite error:", error);
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

  function formatDate(date: string) {
    const listingDate = new Date(date);
    const now = new Date();

    const difference =
      now.getTime() - listingDate.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    const hours = Math.floor(
      difference / (1000 * 60 * 60)
    );

    const days = Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return listingDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matchingListings = listings.filter(
      (listing) => {
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

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );

    return [...matchingListings].sort(
      (a, b) => {
        const aPromoted = isPromoted(a);
        const bPromoted = isPromoted(b);

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

        return (
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
        );
      }
    );
  }, [
    listings,
    search,
    category,
  ]);

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

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#171717] flex flex-col">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">

        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8 py-3">

          <div className="flex items-center gap-3">

            {/* LOGO */}
            <Link
              href="/"
              className="shrink-0 text-2xl sm:text-3xl font-black tracking-tight text-black hover:opacity-70 transition"
            >
              Sellio
            </Link>

            {/* SEARCH */}
            <div className="flex-1 max-w-3xl mx-auto">

              <div className="flex items-center bg-[#f3f3f3] border border-gray-300 rounded-xl overflow-hidden focus-within:border-black focus-within:bg-white transition">

                <span className="pl-3 text-lg text-gray-500">
                  🔍
                </span>

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
                      event.key === "Enter"
                    ) {
                      performSearch();
                    }
                  }}
                  placeholder="What are you looking for?"
                  className="flex-1 min-w-0 bg-transparent px-3 py-3 outline-none text-sm"
                />

                <button
                  type="button"
                  onClick={performSearch}
                  className="bg-black text-white px-4 sm:px-6 py-3 font-bold text-sm hover:bg-[#222] transition"
                >
                  Search
                </button>

              </div>

            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              <Link
                href="/favourites"
                title="Favourites"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
              >
                ❤️
              </Link>

              <MessageBadge />

              <Link
                href="/profile"
                title="Profile"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
              >
                👤
              </Link>

              <Link
                href="/sell"
                className="hidden sm:flex bg-black text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-[#222] transition"
              >
                + Sell
              </Link>

              <Link
                href="/sell"
                className="sm:hidden flex bg-black text-white w-9 h-9 items-center justify-center rounded-xl font-black text-lg"
              >
                +
              </Link>

            </div>

          </div>

        </div>
      </header>

      {/* CATEGORIES */}
      <section className="bg-white border-b border-gray-200">

        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8 py-3">

          <div className="flex gap-2 overflow-x-auto pb-1">

            {categories.map(
              (item) => {

                const active =
                  category ===
                  item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() =>
                      setCategory(
                        item.name
                      )
                    }
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
                      active
                        ? "bg-black text-white"
                        : "bg-[#f1f1f1] text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>
                      {item.icon}
                    </span>

                    <span>
                      {item.name}
                    </span>
                  </button>
                );
              }
            )}

          </div>

        </div>
      </section>

      {/* MAIN */}
      <div className="flex-1">

        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8">

          {/* TOP AD */}
          <div className="py-4">

            <div className="h-20 sm:h-24 bg-white border border-gray-200 rounded-xl flex items-center justify-center">

              <div className="text-center">

                <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-gray-400">
                  Advertisement
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Your advertisement could appear here
                </p>

              </div>

            </div>

          </div>

          {/* CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-5 pb-8">

            {/* SIDEBAR */}
            <aside className="hidden lg:block">

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-[90px]">

                <div className="px-4 py-4 border-b border-gray-200">

                  <h2 className="font-black text-lg">
                    Categories
                  </h2>

                </div>

                <div className="p-2">

                  {categories.map(
                    (item) => {

                      const active =
                        category ===
                        item.name;

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() =>
                            setCategory(
                              item.name
                            )
                          }
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm transition ${
                            active
                              ? "bg-black text-white font-black"
                              : "hover:bg-gray-100 text-gray-700 font-semibold"
                          }`}
                        >
                          <span className="text-lg">
                            {item.icon}
                          </span>

                          <span className="truncate">
                            {item.name}
                          </span>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

            </aside>

            {/* LISTINGS */}
            <section>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">

                <div>

                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400">
                    Sellio Marketplace
                  </p>

                  <h1 className="text-2xl sm:text-3xl font-black mt-1">
                    {search ||
                    category !==
                      "All"
                      ? "Listings"
                      : "Latest Listings"}
                  </h1>

                </div>

                <p className="text-sm text-gray-500">
                  {filteredListings.length}{" "}
                  {filteredListings.length ===
                  1
                    ? "listing"
                    : "listings"}
                </p>

              </div>

              {/* ACTIVE FILTER */}
              {(search ||
                category !==
                  "All") && (
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                  <p className="text-sm text-gray-600">

                    {search && (
                      <>
                        Results for{" "}
                        <strong className="text-black">
                          "{search}"
                        </strong>
                      </>
                    )}

                    {!search &&
                      category !==
                        "All" && (
                        <>
                          Category:{" "}
                          <strong className="text-black">
                            {category}
                          </strong>
                        </>
                      )}

                  </p>

                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    className="text-sm font-bold text-gray-600 hover:text-red-600 transition"
                  >
                    Clear filters
                  </button>

                </div>
              )}

              {/* ERROR */}
              {errorMessage && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
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

                <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">

                  <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />

                  <p className="text-gray-500 mt-4">
                    Loading listings...
                  </p>

                </div>

              ) : filteredListings.length ===
                0 ? (

                <div className="bg-white border border-gray-200 rounded-xl py-20 px-6 text-center">

                  <div className="text-6xl">
                    📦
                  </div>

                  <h2 className="text-2xl font-black mt-5">
                    No listings found
                  </h2>

                  <p className="text-gray-500 mt-2">
                    {search
                      ? `No listing matches "${search}".`
                      : category !==
                        "All"
                      ? `There are no listings in ${category}.`
                      : "There are currently no listings."}
                  </p>

                  {(search ||
                    category !==
                      "All") && (
                    <button
                      type="button"
                      onClick={
                        clearSearch
                      }
                      className="mt-5 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-[#222] transition"
                    >
                      Clear Filters
                    </button>
                  )}

                </div>

              ) : (

                <div className="space-y-3">

                  {filteredListings.map(
                    (listing) => {

                      const promoted =
                        isPromoted(
                          listing
                        );

                      const isFavourite =
                        favourites.includes(
                          listing.id
                        );

                      return (
                        <Link
                          key={
                            listing.id
                          }
                          href={`/listing?id=${encodeURIComponent(
                            String(
                              listing.id
                            )
                          )}`}
                          className={`group block bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
                            promoted
                              ? "border-black"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >

                          <div className="flex">

                            {/* IMAGE */}
                            <div className="relative w-[135px] sm:w-[220px] md:w-[260px] shrink-0">

                              {listing.image ? (

                                <img
                                  src={
                                    listing.image
                                  }
                                  alt={
                                    listing.title ||
                                    "Listing"
                                  }
                                  className="w-full h-full min-h-[150px] sm:min-h-[190px] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                />

                              ) : (

                                <div className="w-full h-full min-h-[150px] sm:min-h-[190px] bg-gray-100 flex items-center justify-center text-4xl">
                                  📷
                                </div>

                              )}

                              {promoted && (
                                <span className="absolute top-2 left-2 bg-black text-white text-[9px] uppercase tracking-wide font-black px-2 py-1 rounded-md">
                                  🚀 Promoted
                                </span>
                              )}

                            </div>

                            {/* INFO */}
                            <div className="flex-1 min-w-0 p-3 sm:p-5 flex flex-col">

                              <div className="flex items-start justify-between gap-3">

                                <div className="min-w-0">

                                  {listing.category && (
                                    <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 font-bold truncate">
                                      {listing.category}
                                    </p>
                                  )}

                                  <h2 className="font-black text-base sm:text-xl leading-tight mt-1 line-clamp-2 group-hover:underline">
                                    {listing.title ||
                                      "Untitled listing"}
                                  </h2>

                                </div>

                                <button
                                  type="button"
                                  onClick={(
                                    event
                                  ) =>
                                    toggleFavourite(
                                      event,
                                      listing.id
                                    )
                                  }
                                  className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition ${
                                    isFavourite
                                      ? "bg-red-50 border-red-200 text-red-600"
                                      : "bg-white border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200"
                                  }`}
                                  title={
                                    isFavourite
                                      ? "Remove from favourites"
                                      : "Add to favourites"
                                  }
                                  aria-label={
                                    isFavourite
                                      ? "Remove from favourites"
                                      : "Add to favourites"
                                  }
                                >
                                  {isFavourite
                                    ? "❤️"
                                    : "♡"}
                                </button>

                              </div>

                              {/* PRICE */}
                              <p className="text-xl sm:text-2xl font-black mt-3">
                                £
                                {Number(
                                  listing.price ||
                                    0
                                ).toLocaleString(
                                  "en-GB"
                                )}
                              </p>

                              {/* DESCRIPTION */}
                              {listing.description && (
                                <p className="hidden sm:block text-sm text-gray-500 mt-2 line-clamp-2">
                                  {
                                    listing.description
                                  }
                                </p>
                              )}

                              {/* BOTTOM INFO */}
                              <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                                <div className="flex items-center gap-3 text-xs text-gray-500">

                                  {listing.location && (
                                    <span className="truncate">
                                      📍{" "}
                                      {
                                        listing.location
                                      }
                                    </span>
                                  )}

                                  <span className="hidden sm:inline text-gray-300">
                                    •
                                  </span>

                                  <span>
                                    {formatDate(
                                      listing.created_at
                                    )}
                                  </span>

                                </div>

                                <span className="hidden sm:inline text-xs font-bold text-gray-400 group-hover:text-black transition">
                                  View listing →
                                </span>

                              </div>

                            </div>

                          </div>

                        </Link>
                      );
                    }
                  )}

                </div>

              )}

            </section>

          </div>

          {/* CTA */}
          <section className="pb-8">

            <div className="bg-black text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">

              <div>

                <p className="text-xl sm:text-2xl font-black">
                  Have something to sell?
                </p>

                <p className="text-gray-400 text-sm mt-1">
                  Create a listing and reach buyers on Sellio.
                </p>

              </div>

              <Link
                href="/sell"
                className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-black transition"
              >
                + Create Listing
              </Link>

            </div>

          </section>

          {/* BOTTOM AD */}
          <section className="pb-8">

            <div className="bg-white border border-gray-200 rounded-xl h-24 sm:h-28 flex items-center justify-center text-center">

              <div>

                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Advertisement
                </p>

                <p className="text-gray-500 text-xs font-semibold mt-1">
                  Your advertisement could appear here
                </p>

              </div>

            </div>

          </section>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="bg-black text-gray-400">

        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8 py-8">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="text-center sm:text-left">

              <p className="text-white text-xl font-black">
                Sellio
              </p>

              <p className="text-xs mt-1 text-gray-500">
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