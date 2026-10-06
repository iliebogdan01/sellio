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

      setFavourites((prev) =>
        prev.filter((id) => id !== listingId)
      );
    } else {
      await supabase.from("favourites").insert({
        user_id: userId,
        listing_id: listingId,
      });

      setFavourites((prev) => [...prev, listingId]);
    }
  }

  const isPromoted = (listing: Listing) => {
    if (!listing.promoted) return false;

    if (!listing.promoted_until) return true;

    return new Date(listing.promoted_until) > new Date();
  };

  const filteredListings = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    let result = listings.filter((listing) => {
      const matchesSearch =
        !searchText ||
        listing.title.toLowerCase().includes(searchText) ||
        listing.description?.toLowerCase().includes(searchText) ||
        listing.location?.toLowerCase().includes(searchText);

      const matchesCategory =
        !selectedCategory ||
        listing.category === selectedCategory;

      const price = Number(listing.price);

      const matchesMinPrice =
        !minPrice || price >= Number(minPrice);

      const matchesMaxPrice =
        !maxPrice || price <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      }

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

      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      return 0;
    });

    return result;
  }, [
    listings,
    search,
    selectedCategory,
    sortBy,
    minPrice,
    maxPrice,
  ]);

  function clearFilters() {
    setSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f6f6f6] text-black">

      {/* =========================
          HEADER
      ========================== */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-[76px] w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">

          {/* LOGO */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="shrink-0 text-3xl font-black tracking-[-1.5px] sm:text-4xl"
          >
            Sellio
          </Link>

          {/* DESKTOP SEARCH */}
          <div className="hidden min-w-0 flex-1 md:block">
            <div className="mx-auto flex h-12 max-w-[720px] overflow-hidden rounded-xl border border-gray-300 bg-gray-50 transition focus-within:border-black focus-within:bg-white">

              <div className="flex flex-1 items-center">
                <span className="pl-4 text-lg">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for cars, electronics, fashion and more..."
                  className="h-full w-full bg-transparent px-3 text-sm outline-none lg:text-base"
                />
              </div>

              <button
                type="button"
                className="px-7 font-bold text-white bg-black transition hover:bg-gray-800"
              >
                Search
              </button>
            </div>
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden shrink-0 items-center gap-1 lg:flex">

            <Link
              href="/favourites"
              className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-gray-100"
            >
              ❤️ Favourites
            </Link>

            <Link
              href="/my-listings"
              className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-gray-100"
            >
              My Listings
            </Link>

            <Link
              href="/messages"
              className="flex h-10 items-center justify-center rounded-lg px-3 transition hover:bg-gray-100"
              title="Messages"
            >
              <MessageBadge />
            </Link>

            <Link
              href="/profile"
              className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-gray-100"
            >
              👤 Profile
            </Link>

            <Link
              href="/sell"
              className="ml-2 rounded-lg bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              + Sell
            </Link>
          </div>

          {/* MOBILE SEARCH */}
          <div className="flex min-w-0 flex-1 md:hidden">
            <div className="flex w-full overflow-hidden rounded-full border border-gray-300 bg-gray-50">

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings..."
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
              />

              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white"
              >
                🔍
              </button>

            </div>
          </div>

          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen((current) => !current)
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-2xl transition hover:bg-gray-100 md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white px-3 py-3 shadow-lg md:hidden">

            <div className="grid grid-cols-2 gap-2">

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:bg-gray-100"
              >
                🏠
                <span>Home</span>
              </Link>

              <Link
                href="/my-listings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:bg-gray-100"
              >
                📋
                <span>My Listings</span>
              </Link>

              <Link
                href="/favourites"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:bg-gray-100"
              >
                ❤️
                <span>Favourites</span>
              </Link>

              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:bg-gray-100"
              >
                💬
                <span>Messages</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:bg-gray-100"
              >
                👤
                <span>Profile</span>
              </Link>

              <Link
                href="/sell"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                + Sell
              </Link>

            </div>
          </div>
        )}
      </header>


      {/* =========================
          DESKTOP CATEGORY BAR
      ========================== */}
      <section className="hidden border-b border-gray-200 bg-white md:block">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-5 lg:px-8">

          <div className="flex items-center justify-between gap-4">

            <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto">

              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  selectedCategory === ""
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-black"
                }`}
              >
                🔥 All
              </button>

              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.name
                        ? ""
                        : category.name
                    )
                  }
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    selectedCategory === category.name
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white hover:border-black"
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}

            </div>

          </div>

        </div>
      </section>


      {/* =========================
          MOBILE CATEGORIES
      ========================== */}
      <section className="w-full overflow-hidden border-b bg-white md:hidden">
        <div className="w-full px-3 py-4">

          <div className="flex gap-2 overflow-x-auto pb-1">

            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className={`flex min-w-[100px] shrink-0 flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                selectedCategory === ""
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="text-2xl">🔥</span>
              <span className="mt-1 text-xs font-semibold">
                All
              </span>
            </button>

            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name
                      ? ""
                      : category.name
                  )
                }
                className={`flex min-w-[110px] shrink-0 flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                  selectedCategory === category.name
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-2xl">
                  {category.icon}
                </span>

                <span className="mt-1 text-xs font-semibold">
                  {category.name}
                </span>
              </button>
            ))}

          </div>
        </div>
      </section>


      {/* =========================
          MAIN CONTENT
      ========================== */}
      <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* TOP AREA */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="mb-2 text-sm font-semibold text-gray-500">
              Sellio Marketplace
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Latest Listings
            </h1>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Discover great deals from sellers on Sellio
            </p>
          </div>

          {/* SORT */}
          <div className="flex items-center gap-2">

            <span className="hidden text-sm font-medium text-gray-500 sm:block">
              Sort by
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-black"
            >
              <option value="newest">
                Newest first
              </option>

              <option value="oldest">
                Oldest first
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="title">
                A - Z
              </option>
            </select>

          </div>

        </div>


        {/* DESKTOP FILTER + LISTINGS */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">

          {/* FILTER SIDEBAR */}
          <aside className="hidden lg:block">

            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">
                  Filters
                </h2>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-gray-500 hover:text-black"
                >
                  Clear
                </button>
              </div>

              {/* CATEGORY */}
              <div className="mt-6">

                <h3 className="text-sm font-bold">
                  Category
                </h3>

                <div className="mt-3 space-y-1">

                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedCategory === ""
                        ? "bg-black font-bold text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span>All categories</span>
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(category.name)
                      }
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        selectedCategory === category.name
                          ? "bg-black font-bold text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  ))}

                </div>

              </div>


              {/* PRICE */}
              <div className="mt-7 border-t border-gray-200 pt-6">

                <h3 className="text-sm font-bold">
                  Price
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-2">

                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min £"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />

                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max £"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />

                </div>

              </div>


              {/* ACTIVE FILTER */}
              {(selectedCategory || minPrice || maxPrice) && (
                <div className="mt-6 rounded-xl bg-gray-50 p-3">

                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Active filters
                  </div>

                  <div className="mt-2 space-y-1 text-sm">

                    {selectedCategory && (
                      <div>
                        📂 {selectedCategory}
                      </div>
                    )}

                    {minPrice && (
                      <div>
                        💷 From £{minPrice}
                      </div>
                    )}

                    {maxPrice && (
                      <div>
                        💷 Up to £{maxPrice}
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

          </aside>


          {/* LISTINGS */}
          <section className="min-w-0">

            {/* RESULT BAR */}
            <div className="mb-4 flex items-center justify-between">

              <div className="text-sm text-gray-500">
                <span className="font-bold text-black">
                  {filteredListings.length}
                </span>{" "}
                listings found
              </div>

              {(selectedCategory || minPrice || maxPrice || search) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold underline"
                >
                  Clear filters
                </button>
              )}

            </div>


            {loading ? (
              <div className="rounded-2xl border bg-white py-24 text-center text-gray-500">
                Loading listings...
              </div>
            ) : filteredListings.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">

                <div className="text-6xl">
                  📦
                </div>

                <h2 className="mt-5 text-2xl font-black">
                  No listings found
                </h2>

                <p className="mt-2 text-gray-500">
                  Try another search or change your filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-lg bg-black px-6 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  Clear filters
                </button>

              </div>

            ) : (

              <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">

                {filteredListings.map((listing) => {

                  const favourite = favourites.includes(
                    listing.id
                  );

                  const promoted = isPromoted(listing);

                  const image =
                    listing.image ||
                    (listing.images &&
                    listing.images.length > 0
                      ? listing.images[0]
                      : null);

                  return (
                    <article
                      key={listing.id}
                      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
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
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-5xl text-gray-400">
                            📷
                          </div>
                        )}

                        {promoted && (
                          <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white shadow">
                            PROMOTED
                          </div>
                        )}

                      </Link>


                      {/* FAVOURITE */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleFavourite(listing.id)
                        }
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-lg transition hover:scale-110"
                        title={
                          favourite
                            ? "Remove from favourites"
                            : "Add to favourites"
                        }
                      >
                        {favourite ? "❤️" : "🤍"}
                      </button>


                      {/* INFO */}
                      <div className="flex flex-1 flex-col p-5">

                        <Link
                          href={`/listing?id=${listing.id}`}
                          className="line-clamp-2 text-lg font-bold leading-tight hover:underline"
                        >
                          {listing.title}
                        </Link>

                        <div className="mt-3 text-2xl font-black">
                          £
                          {Number(
                            listing.price
                          ).toLocaleString()}
                        </div>

                        {listing.location && (
                          <div className="mt-3 truncate text-sm text-gray-500">
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
                          className="mt-5 flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                        >
                          View Listing
                        </Link>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </section>

        </div>


        {/* CTA */}
        <section className="mt-12 overflow-hidden rounded-3xl bg-black px-6 py-12 text-center text-white sm:mt-16 sm:px-10 sm:py-16">

          <div className="mx-auto max-w-2xl">

            <div className="mb-3 text-3xl">
              🚀
            </div>

            <h2 className="text-3xl font-black sm:text-4xl">
              Have something to sell?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">
              Create your listing and reach buyers on Sellio.
            </p>

            <Link
              href="/sell"
              className="mt-7 inline-flex rounded-xl bg-white px-8 py-3.5 font-bold text-black transition hover:bg-gray-200"
            >
              + Create Listing
            </Link>

          </div>

        </section>

      </div>


      {/* =========================
          FOOTER
      ========================== */}
      <footer className="border-t border-gray-200 bg-white">

        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">

          <div>
            © {new Date().getFullYear()} Sellio. All rights reserved.
          </div>

          <div className="flex flex-wrap gap-5">

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
              className="font-semibold text-black hover:underline"
            >
              Sell
            </Link>

          </div>

        </div>

      </footer>

    </main>
  );
}