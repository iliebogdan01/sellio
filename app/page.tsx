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
  const [sortBy, setSortBy] = useState("newest");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [favourites, setFavourites] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);

      const { data: listingsData, error: listingsError } = await supabase
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

      if (listingsError) {
        console.error("Listings error:", listingsError);
      }

      setListings((listingsData as Listing[]) || []);

      if (user) {
        const { data: favouritesData, error: favouritesError } =
          await supabase
            .from("favourites")
            .select("listing_id")
            .eq("user_id", user.id);

        if (favouritesError) {
          console.error("Favourites error:", favouritesError);
        }

        setFavourites(
          (favouritesData || []).map((item) => Number(item.listing_id))
        );
      } else {
        setFavourites([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavourite(listingId: number) {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    const isFavourite = favourites.includes(listingId);

    if (isFavourite) {
      const { error } = await supabase
        .from("favourites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId);

      if (error) {
        console.error("Remove favourite error:", error);
        return;
      }

      setFavourites((current) =>
        current.filter((id) => id !== listingId)
      );
    } else {
      const { error } = await supabase.from("favourites").insert({
        user_id: userId,
        listing_id: listingId,
      });

      if (error) {
        console.error("Add favourite error:", error);
        return;
      }

      setFavourites((current) => [...current, listingId]);
    }
  }

  const filteredListings = useMemo(() => {
    let result = [...listings];

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((item) => {
        const text = [
          item.title,
          item.description,
          item.location,
          item.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(searchValue);
      });
    }

    if (selectedCategory) {
      result = result.filter(
        (item) => item.category === selectedCategory
      );
    }

    if (minPrice) {
      const min = Number(minPrice);

      result = result.filter((item) => Number(item.price) >= min);
    }

    if (maxPrice) {
      const max = Number(maxPrice);

      result = result.filter((item) => Number(item.price) <= max);
    }

    result.sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "price-low") {
        return Number(a.price) - Number(b.price);
      }

      if (sortBy === "price-high") {
        return Number(b.price) - Number(a.price);
      }

      if (sortBy === "a-z") {
        return a.title.localeCompare(b.title);
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

    return result;
  }, [
    listings,
    search,
    selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  function clearFilters() {
    setSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  }

  function isPromoted(item: Listing) {
    if (!item.promoted) return false;

    if (!item.promoted_until) return true;

    return new Date(item.promoted_until).getTime() > Date.now();
  }

  function getImage(item: Listing) {
    if (item.image) return item.image;

    if (item.images && item.images.length > 0) {
      return item.images[0];
    }

    return null;
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f5f5] text-black">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center gap-4">

            {/* LOGO */}
            <Link
              href="/"
              className="shrink-0 text-3xl font-black tracking-tight"
            >
              Sellio
            </Link>

            {/* DESKTOP SEARCH */}
            <div className="hidden min-w-0 flex-1 md:block">
              <div className="mx-auto flex max-w-[1100px] overflow-hidden rounded-xl border border-gray-300 bg-white">

                <div className="flex items-center px-4 text-gray-400">
                  🔍
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for anything..."
                  className="h-12 min-w-0 flex-1 bg-transparent px-2 text-base outline-none"
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="px-4 text-gray-500 hover:text-black"
                  >
                    ✕
                  </button>
                )}

                <button className="bg-black px-7 font-semibold text-white transition hover:bg-gray-800">
                  Search
                </button>

              </div>
            </div>

            {/* DESKTOP ACTIONS */}
            <div className="hidden shrink-0 items-center gap-2 lg:flex">

              <Link
                href="/favourites"
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
              >
                ♡ Favourites
              </Link>

              <Link
                href="/my-listings"
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
              >
                My Listings
              </Link>

              <MessageBadge />

              <Link
                href="/profile"
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Profile
              </Link>

              <Link
                href="/sell"
                className="rounded-xl bg-black px-5 py-3 font-bold text-white transition hover:bg-gray-800"
              >
                + Sell
              </Link>

            </div>

            {/* MOBILE MENU */}
            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="ml-auto rounded-lg border border-gray-300 px-3 py-2 text-xl md:hidden"
            >
              ☰
            </button>

          </div>

          {/* MOBILE SEARCH */}
          <div className="pb-3 md:hidden">
            <div className="flex overflow-hidden rounded-xl border border-gray-300 bg-white">

              <div className="flex items-center px-3 text-gray-400">
                🔍
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-11 min-w-0 flex-1 bg-transparent px-2 outline-none"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-3 text-gray-500"
                >
                  ✕
                </button>
              )}

            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <div className="space-y-1 px-4 py-4">

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium hover:bg-gray-100"
              >
                🏠 Home
              </Link>

              <Link
                href="/my-listings"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium hover:bg-gray-100"
              >
                📋 My Listings
              </Link>

              <Link
                href="/favourites"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium hover:bg-gray-100"
              >
                ♡ Favourites
              </Link>

              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium hover:bg-gray-100"
              >
                💬 Messages
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium hover:bg-gray-100"
              >
                👤 Profile
              </Link>

              <Link
                href="/sell"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl bg-black px-4 py-3 text-center font-bold text-white"
              >
                + Sell
              </Link>

            </div>
          </div>
        )}

      </header>

      {/* DESKTOP CATEGORY BAR */}
      <div className="hidden border-b border-gray-200 bg-white lg:block">
        <div className="w-full overflow-x-auto px-4 sm:px-6 lg:px-8">

          <div className="flex min-w-max items-center gap-2 py-3">

            <button
              onClick={() => setSelectedCategory("")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                !selectedCategory
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name
                      ? ""
                      : category.name
                  )
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category.name
                    ? "bg-black text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}

          </div>

        </div>
      </div>

      {/* MOBILE CATEGORIES */}
      <div className="border-b border-gray-200 bg-white lg:hidden">
        <div className="overflow-x-auto px-4 py-3">

          <div className="flex min-w-max gap-2">

            <button
              onClick={() => setSelectedCategory("")}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                !selectedCategory
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name
                      ? ""
                      : category.name
                  )
                }
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  selectedCategory === category.name
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <span className="mr-1">
                  {category.icon}
                </span>

                {category.name}
              </button>
            ))}

          </div>

        </div>
      </div>

      {/* MAIN CONTENT */}
      <section className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

          <div>

            <h1 className="text-2xl font-black sm:text-3xl">
              Find what you need
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Discover great deals from sellers on Sellio.
            </p>

          </div>

          <div className="text-sm text-gray-500">

            <span className="font-semibold text-black">
              {filteredListings.length}
            </span>{" "}

            {filteredListings.length === 1
              ? "listing"
              : "listings"}

          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">

          {/* SIDEBAR */}
          <aside className="hidden h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:block">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-lg font-bold">
                Filters
              </h2>

              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-gray-500 hover:text-black"
              >
                Clear
              </button>

            </div>

            <div className="mb-6">

              <label className="mb-2 block text-sm font-semibold">
                Category
              </label>

              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none focus:border-black"
              >
                <option value="">
                  All categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category.name}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}

              </select>

            </div>

            <div className="mb-6">

              <label className="mb-2 block text-sm font-semibold">
                Price
              </label>

              <div className="grid grid-cols-2 gap-2">

                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) =>
                    setMinPrice(e.target.value)
                  }
                  placeholder="Min"
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-black"
                />

                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value)
                  }
                  placeholder="Max"
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-black"
                />

              </div>

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Sort by
              </label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none focus:border-black"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="oldest">
                  Oldest
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="a-z">
                  A-Z
                </option>

              </select>

            </div>

          </aside>

          {/* LISTINGS */}
          <div className="min-w-0">

            {/* MOBILE FILTERS */}
            <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:hidden">

              <div className="grid grid-cols-2 gap-3">

                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value)
                  }
                  className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none"
                >
                  <option value="">
                    All categories
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.name}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}

                </select>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none"
                >
                  <option value="newest">
                    Newest
                  </option>

                  <option value="oldest">
                    Oldest
                  </option>

                  <option value="price-low">
                    Price Low
                  </option>

                  <option value="price-high">
                    Price High
                  </option>

                  <option value="a-z">
                    A-Z
                  </option>

                </select>

                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) =>
                    setMinPrice(e.target.value)
                  }
                  placeholder="Min price"
                  className="rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none"
                />

                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value)
                  }
                  placeholder="Max price"
                  className="rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none"
                />

              </div>

              <button
                onClick={clearFilters}
                className="mt-3 w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold hover:bg-gray-200"
              >
                Clear filters
              </button>

            </div>

            {/* LOADING */}
            {loading ? (

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">

                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                  >

                    <div className="aspect-[4/3] animate-pulse bg-gray-200" />

                    <div className="space-y-3 p-4">

                      <div className="h-5 animate-pulse rounded bg-gray-200" />

                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />

                      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />

                    </div>

                  </div>
                ))}

              </div>

            ) : filteredListings.length === 0 ? (

              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">

                <div className="text-5xl">
                  🔎
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  No listings found
                </h2>

                <p className="mt-2 text-gray-500">
                  Try changing your search or filters.
                </p>

                <button
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
                >
                  Clear filters
                </button>

              </div>

            ) : (

              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

                {filteredListings.map((item) => {

                  const image = getImage(item);
                  const promoted = isPromoted(item);
                  const favourite = favourites.includes(item.id);

                  return (
                    <article
                      key={item.id}
                      className="group min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >

                      {/* IMAGE */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">

                        {image ? (
                          <img
                            src={image}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl text-gray-300">
                            📷
                          </div>
                        )}

                        {promoted && (
                          <div className="absolute left-3 top-3 rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white shadow">
                            PROMOTED
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavourite(item.id);
                          }}
                          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl shadow-md backdrop-blur transition hover:scale-105 ${
                            favourite
                              ? "text-red-500"
                              : "text-gray-700"
                          }`}
                          aria-label="Favourite"
                        >
                          {favourite ? "♥" : "♡"}
                        </button>

                      </div>

                      {/* CONTENT */}
                      <Link
                        href={`/listing?id=${item.id}`}
                        className="block"
                      >

                        <div className="p-4">

                          <h2 className="line-clamp-2 min-w-0 text-base font-bold leading-tight">
                            {item.title}
                          </h2>

                          <div className="mt-2 text-xl font-black">
                            £
                            {Number(item.price).toLocaleString(
                              "en-GB"
                            )}
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-gray-500">

                            {item.location && (
                              <div className="truncate">
                                📍 {item.location}
                              </div>
                            )}

                            {item.category && (
                              <div className="truncate">
                                {item.category}
                              </div>
                            )}

                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">

                            <span className="text-xs text-gray-400">
                              {new Date(
                                item.created_at
                              ).toLocaleDateString("en-GB")}
                            </span>

                            <span className="text-sm font-bold">
                              View listing →
                            </span>

                          </div>

                        </div>

                      </Link>

                    </article>
                  );
                })}

              </div>

            )}

          </div>

        </div>

      </section>

      {/* SELL CTA */}
      <section className="w-full px-4 pb-10 sm:px-6 lg:px-8">

        <div className="rounded-3xl bg-black px-6 py-10 text-white sm:px-10">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h2 className="text-2xl font-black sm:text-3xl">
                Have something to sell?
              </h2>

              <p className="mt-2 max-w-2xl text-gray-300">
                Create your listing and reach buyers on Sellio.
              </p>

            </div>

            <Link
              href="/sell"
              className="inline-flex w-fit rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-gray-200"
            >
              + Sell something
            </Link>

          </div>

        </div>

      </section>

      {/* FOOTER - STAYS AT THE BOTTOM */}
      <footer className="mt-auto border-t border-gray-200 bg-white">

        <div className="w-full px-4 py-8 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="text-2xl font-black">
                Sellio
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Buy and sell anything, simply.
              </p>

            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-gray-600">

              <Link
                href="/profile"
                className="hover:text-black"
              >
                Profile
              </Link>

              <Link
                href="/messages"
                className="hover:text-black"
              >
                Messages
              </Link>

              <Link
                href="/my-listings"
                className="hover:text-black"
              >
                My Listings
              </Link>

              <Link
                href="/favourites"
                className="hover:text-black"
              >
                Favourites
              </Link>

              <Link
                href="/sell"
                className="hover:text-black"
              >
                Sell
              </Link>

            </div>

          </div>

          <div className="mt-6 border-t border-gray-100 pt-5 text-xs text-gray-400">
            © {new Date().getFullYear()} Sellio. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}