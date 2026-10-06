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
  promoted: boolean | null;
  promoted_until: string | null;
};

const categories = [
  { name: "Cars & Vehicles", icon: "🚗" },
  { name: "Property", icon: "🏠" },
  { name: "Electronics", icon: "📱" },
  { name: "Fashion", icon: "👕" },
  { name: "Home & Garden", icon: "🏡" },
  { name: "Gaming", icon: "🎮" },
  { name: "Baby & Kids", icon: "🧸" },
  { name: "Services", icon: "🔧" },
];

export default function HomePage() {
  const supabase = createClient();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [favourites, setFavourites] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
    loadListings();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      return;
    }

    setUserId(user.id);
    loadFavourites(user.id);
  }

  async function loadFavourites(id: string) {
    const { data } = await supabase
      .from("favourites")
      .select("listing_id")
      .eq("user_id", id);

    if (data) {
      setFavourites(data.map((item) => Number(item.listing_id)));
    }
  }

  async function loadListings() {
    setLoading(true);

    const { data, error } = await supabase
      .from("listings")
      .select(
        `
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
      `
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      setListings(data as Listing[]);
    }

    setLoading(false);
  }

  async function toggleFavourite(listingId: number) {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    const alreadyFavourite = favourites.includes(listingId);

    if (alreadyFavourite) {
      await supabase
        .from("favourites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId);

      setFavourites((prev) => prev.filter((id) => id !== listingId));
    } else {
      await supabase.from("favourites").insert({
        user_id: userId,
        listing_id: listingId,
      });

      setFavourites((prev) => [...prev, listingId]);
    }
  }

  const filteredListings = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return listings.filter((listing) => {
      const matchesSearch =
        !searchText ||
        listing.title.toLowerCase().includes(searchText) ||
        listing.description?.toLowerCase().includes(searchText) ||
        listing.location?.toLowerCase().includes(searchText);

      const matchesCategory =
        !selectedCategory || listing.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [listings, search, selectedCategory]);

  const isPromoted = (listing: Listing) => {
    if (!listing.promoted) return false;

    if (!listing.promoted_until) return true;

    return new Date(listing.promoted_until) > new Date();
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="flex h-16 w-full items-center gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
          {/* LOGO */}
          <Link
            href="/"
            className="shrink-0 text-2xl font-black tracking-tight sm:text-3xl"
          >
            Sellio
          </Link>

          {/* SEARCH */}
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex w-full items-center overflow-hidden rounded-full border border-gray-300 bg-gray-50">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings..."
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none sm:px-5 sm:text-base"
              />

              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white sm:h-11 sm:w-12"
              >
                🔍
              </button>
            </div>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {/* FAVOURITES */}
            <Link
              href="/favourites"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg transition hover:bg-gray-100 sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:py-2"
              title="Favourites"
            >
              ❤️
              <span className="hidden sm:ml-1 sm:inline">Favourites</span>
            </Link>

            {/* MY LISTINGS */}
            <Link
              href="/my-listings"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-gray-100 md:block"
            >
              My Listings
            </Link>

            {/* MESSAGES */}
            <Link
              href="/messages"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 sm:h-auto sm:w-auto sm:rounded-lg sm:border-0"
              title="Messages"
            >
              <MessageBadge />
            </Link>

            {/* PROFILE */}
            <Link
              href="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg transition hover:bg-gray-100 sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:py-2"
              title="Profile"
            >
              👤
              <span className="hidden sm:ml-1 sm:inline">Profile</span>
            </Link>

            {/* SELL DESKTOP */}
            <Link
              href="/sell"
              className="hidden rounded-lg bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 sm:flex"
            >
              + Sell
            </Link>

            {/* SELL MOBILE */}
            <Link
              href="/sell"
              className="flex h-10 items-center justify-center rounded-lg bg-black px-3 text-sm font-bold text-white sm:hidden"
            >
              + Sell
            </Link>
          </div>
        </div>
      </header>

      {/* CATEGORIES */}
      <section className="w-full overflow-hidden border-b bg-white">
        <div className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:gap-4 lg:grid-cols-8">
            {/* ALL */}
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className={`flex min-w-[110px] shrink-0 flex-col items-center justify-center rounded-xl border p-3 text-center transition sm:min-w-0 ${
                selectedCategory === ""
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl">🔥</span>
              <span className="mt-1 text-xs font-semibold">All</span>
            </button>

            {/* CATEGORIES */}
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name ? "" : category.name
                  )
                }
                className={`flex min-w-[110px] shrink-0 flex-col items-center justify-center rounded-xl border p-3 text-center transition sm:min-w-0 ${
                  selectedCategory === category.name
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <span className="text-2xl">{category.icon}</span>

                <span className="mt-1 text-xs font-semibold">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN */}
      <div className="w-full overflow-hidden px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* TITLE */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black sm:text-4xl">
              Latest Listings
            </h1>

            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Discover great deals from sellers on Sellio
            </p>
          </div>

          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className="w-fit rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Clear category
            </button>
          )}
        </div>

        {/* LISTINGS */}
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            Loading listings...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <div className="text-5xl">📦</div>

            <h2 className="mt-4 text-xl font-bold">
              No listings found
            </h2>

            <p className="mt-2 text-gray-500">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredListings.map((listing) => {
              const favourite = favourites.includes(listing.id);
              const promoted = isPromoted(listing);

              const image =
                listing.image ||
                (listing.images && listing.images.length > 0
                  ? listing.images[0]
                  : null);

              return (
                <article
                  key={listing.id}
                  className="relative flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* IMAGE */}
                  <Link
                    href={`/listing?id=${listing.id}`}
                    className="relative block aspect-[4/3] w-full overflow-hidden bg-gray-100"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl text-gray-400">
                        📷
                      </div>
                    )}

                    {promoted && (
                      <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                        PROMOTED
                      </div>
                    )}
                  </Link>

                  {/* FAVOURITE */}
                  <button
                    type="button"
                    onClick={() => toggleFavourite(listing.id)}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:scale-105"
                    title={
                      favourite
                        ? "Remove from favourites"
                        : "Add to favourites"
                    }
                  >
                    {favourite ? "❤️" : "🤍"}
                  </button>

                  {/* INFO */}
                  <div className="flex w-full flex-1 flex-col p-4">
                    <Link
                      href={`/listing?id=${listing.id}`}
                      className="line-clamp-2 text-base font-bold hover:underline sm:text-lg"
                    >
                      {listing.title}
                    </Link>

                    <div className="mt-2 text-xl font-black">
                      £{Number(listing.price).toLocaleString()}
                    </div>

                    {listing.location && (
                      <div className="mt-2 truncate text-sm text-gray-500">
                        📍 {listing.location}
                      </div>
                    )}

                    {listing.category && (
                      <div className="mt-1 truncate text-xs font-medium text-gray-400">
                        {listing.category}
                      </div>
                    )}

                    <Link
                      href={`/listing?id=${listing.id}`}
                      className="mt-4 flex w-full items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
                    >
                      View Listing
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <section className="mt-10 rounded-2xl bg-black px-5 py-8 text-center text-white sm:mt-16 sm:px-10 sm:py-12">
          <h2 className="text-2xl font-black sm:text-3xl">
            Have something to sell?
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-300 sm:text-base">
            Create your listing and reach buyers on Sellio.
          </p>

          <Link
            href="/sell"
            className="mt-6 inline-flex rounded-lg bg-white px-6 py-3 font-bold text-black transition hover:bg-gray-200"
          >
            + Create Listing
          </Link>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t bg-gray-50">
        <div className="flex w-full flex-col gap-3 px-3 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            © {new Date().getFullYear()} Sellio. All rights reserved.
          </div>

          <div className="flex gap-4">
            <Link href="/profile" className="hover:text-black">
              Profile
            </Link>

            <Link href="/messages" className="hover:text-black">
              Messages
            </Link>

            <Link href="/sell" className="hover:text-black">
              Sell
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}