"use client";

import { useEffect, useState } from "react";

type Listing = {
  id: number | string;
  title: string;
  price: number | string;
  location?: string;
  category?: string;
  description?: string;
  image?: string;
};

const categories = [
  "Cars & Vehicles",
  "Property",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Gaming",
  "Baby & Kids",
  "Services",
];

const advertisements = [
  {
    title: "Your advertisement here",
    text: "Reach thousands of Sellio users.",
  },
  {
    title: "Promote your business",
    text: "Show your products to buyers across the UK.",
  },
  {
    title: "Sell more on Sellio",
    text: "Put your brand in front of local buyers.",
  },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sellio-listings");

      if (saved) {
        const data = JSON.parse(saved);

        if (Array.isArray(data)) {
          setListings(data);
        }
      }
    } catch {
      setListings([]);
    }
  }, []);

  /*
    SCHIMBĂ RECLAMA LA FIECARE 60 DE SECUNDE
  */

  useEffect(() => {
    const interval = setInterval(() => {
      setAdIndex((current) => {
        return (current + 1) % advertisements.length;
      });
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const filteredListings = listings.filter((item) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      item.title?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  const isSearching = search.trim().length > 0;

  const promotedListings = filteredListings.slice(0, 5);

  const currentAd = advertisements[adIndex];

  function clearSearch() {
    setSearch("");
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* HEADER */}

      <header className="bg-white border-b border-gray-200">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          <div className="flex items-center gap-4">

            {/* LOGO */}

            <a
              href="/"
              className="text-3xl font-black text-black tracking-tight shrink-0"
            >
              Sellio
            </a>

            {/* SEARCH */}

            <div className="flex-1 hidden md:block">

              <div className="w-full flex bg-gray-100 border border-gray-200 rounded-xl overflow-hidden">

                <span className="px-4 flex items-center text-gray-500">
                  🔎
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search for anything..."
                  className="flex-1 bg-transparent px-2 py-3 outline-none"
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-4 text-gray-500 hover:text-black"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("search-results")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                  className="bg-gray-900 hover:bg-black text-white px-7 font-semibold"
                >
                  Search
                </button>

              </div>

            </div>

            {/* NAVIGATION */}

            <nav className="hidden xl:flex items-center gap-1">

              <a
                href="/favourites"
                className="px-3 py-2 rounded-lg hover:bg-gray-100"
                title="Favourites"
              >
                ❤️
              </a>

              <a
                href="/messages"
                className="px-3 py-2 rounded-lg hover:bg-gray-100"
                title="Messages"
              >
                💬
              </a>

              <a
                href="/my-listings"
                className="px-3 py-2 rounded-lg hover:bg-gray-100"
                title="My Listings"
              >
                📦
              </a>

              <a
                href="/profile"
                className="px-3 py-2 rounded-lg hover:bg-gray-100"
                title="Profile"
              >
                👤
              </a>

            </nav>

            <a
              href="/sell"
              className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shrink-0"
            >
              + Sell
            </a>

          </div>

          {/* MOBILE SEARCH */}

          <div className="md:hidden mt-3">

            <div className="flex bg-gray-100 border border-gray-200 rounded-xl overflow-hidden">

              <span className="px-3 flex items-center text-gray-500">
                🔎
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search for anything..."
                className="flex-1 bg-transparent px-1 py-2.5 outline-none"
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-3 text-gray-500"
                >
                  ✕
                </button>
              )}

            </div>

          </div>

        </div>

      </header>

      {/* HERO */}

      <section className="bg-gray-950 text-white">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-12 text-center">

          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">
            UK Marketplace
          </p>

          <h1 className="text-4xl md:text-5xl xl:text-6xl font-black mt-3">
            Buy. Sell. Discover.
          </h1>

          <p className="text-gray-400 mt-3 text-lg">
            Find great deals from people near you.
          </p>

          {/* CATEGORIES */}

          <div className="flex justify-center gap-2 flex-wrap mt-8">

            {categories.map((category) => (

              <button
                key={category}
                type="button"
                onClick={() => {
                  setSearch(category);

                  setTimeout(() => {
                    document
                      .getElementById("search-results")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }, 50);
                }}
                className="border border-gray-700 bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300 transition"
              >
                {category}
              </button>

            ))}

          </div>

        </div>

      </section>

      {/* MAIN */}

      <div className="w-full px-3 sm:px-5 lg:px-8">

        {/* LARGE ADVERTISEMENT */}

        <section className="py-7">

          <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden">

            <div className="min-h-[220px] md:min-h-[280px] flex flex-col items-center justify-center text-center px-6">

              <span className="text-xs uppercase tracking-[0.25em] text-gray-400">
                Advertisement
              </span>

              <h2 className="text-2xl md:text-4xl font-black mt-4">
                {currentAd.title}
              </h2>

              <p className="text-gray-500 mt-3">
                {currentAd.text}
              </p>

              <button
                type="button"
                className="mt-6 bg-gray-900 hover:bg-black text-white px-7 py-3 rounded-xl font-bold"
              >
                Advertise with Sellio
              </button>

            </div>

            {/* AD INDICATORS */}

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">

              {advertisements.map((_, index) => (

                <span
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === adIndex
                      ? "w-7 bg-gray-900"
                      : "w-2 bg-gray-300"
                  }`}
                />

              ))}

            </div>

          </div>

        </section>

        {/* SEARCH RESULTS */}

        {isSearching && (

          <section
            id="search-results"
            className="pb-10"
          >

            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div>

                  <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                    Search results
                  </p>

                  <h2 className="text-2xl md:text-3xl font-black mt-1">
                    Results for "{search.trim()}"
                  </h2>

                  <p className="text-gray-500 mt-1">
                    {filteredListings.length}{" "}
                    {filteredListings.length === 1
                      ? "listing"
                      : "listings"}{" "}
                    found
                  </p>

                </div>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="border border-gray-300 hover:border-gray-900 px-5 py-3 rounded-xl font-semibold"
                >
                  Clear search
                </button>

              </div>

            </div>

            {filteredListings.length === 0 ? (

              <div className="bg-white border border-gray-200 rounded-2xl min-h-[280px] flex flex-col items-center justify-center text-center px-6">

                <div className="text-5xl">
                  🔎
                </div>

                <h3 className="text-2xl font-black mt-5">
                  No results found
                </h3>

                <p className="text-gray-500 mt-2 max-w-md">
                  We couldn't find any listings matching
                  your search. Try another word or browse
                  one of the categories.
                </p>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-6 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold"
                >
                  Browse all listings
                </button>

              </div>

            ) : (

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">

                {filteredListings.map((item) => (

                  <ListingCard
                    key={item.id}
                    item={item}
                  />

                ))}

              </div>

            )}

          </section>

        )}

        {/* PROMOTED LISTINGS */}

        {!isSearching && (

          <section className="pb-10">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5">

              <div>

                <div className="flex items-center gap-2">

                  <span className="text-2xl">
                    ★
                  </span>

                  <h2 className="text-2xl md:text-3xl font-black">
                    Promoted Listings
                  </h2>

                </div>

                <p className="text-gray-500 mt-1">
                  Featured items from sellers
                </p>

              </div>

              <span className="text-sm text-gray-500 mt-2 sm:mt-0">
                {promotedListings.length} featured
              </span>

            </div>

            {promotedListings.length === 0 ? (

              <div className="bg-white border border-gray-200 rounded-2xl min-h-[220px] flex items-center justify-center text-gray-500">
                No promoted listings yet.
              </div>

            ) : (

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">

                {promotedListings.map((item) => (

                  <ListingCard
                    key={item.id}
                    item={item}
                    promoted
                  />

                ))}

              </div>

            )}

          </section>

        )}

        {/* SECOND LARGE AD */}

        {!isSearching && (

          <section className="pb-10">

            <div className="bg-gray-900 rounded-2xl min-h-[180px] flex flex-col items-center justify-center text-center text-white px-5">

              <span className="text-gray-500 text-xs uppercase tracking-widest">
                Advertisement
              </span>

              <h2 className="text-2xl font-black mt-3">
                Grow your business with Sellio
              </h2>

              <p className="text-gray-400 mt-2">
                Put your products in front of local buyers.
              </p>

            </div>

          </section>

        )}

        {/* LATEST LISTINGS */}

        {!isSearching && (

          <section className="pb-10">

            <div className="flex items-end justify-between mb-5">

              <div>

                <h2 className="text-2xl md:text-3xl font-black">
                  Latest Listings
                </h2>

                <p className="text-gray-500 mt-1">
                  Recently added items
                </p>

              </div>

              <a
                href="/my-listings"
                className="text-sm font-bold text-gray-700 hover:text-black"
              >
                View all →
              </a>

            </div>

            {filteredListings.length === 0 ? (

              <div className="bg-white border rounded-2xl min-h-[250px] flex flex-col items-center justify-center text-center">

                <div className="text-6xl">
                  📦
                </div>

                <h3 className="text-xl font-bold mt-4">
                  No listings yet
                </h3>

                <p className="text-gray-500 mt-1">
                  Be the first person to sell something.
                </p>

                <a
                  href="/sell"
                  className="mt-5 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Create Listing
                </a>

              </div>

            ) : (

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">

                {filteredListings.map((item) => (

                  <ListingCard
                    key={item.id}
                    item={item}
                  />

                ))}

              </div>

            )}

          </section>

        )}

        {/* QUICK LINKS */}

        <section className="pb-10">

          <div className="grid grid-cols-3 gap-4">

            <a
              href="/profile"
              className="bg-white border rounded-2xl p-5 hover:border-gray-500 hover:shadow-md transition"
            >

              <div className="text-3xl">
                👤
              </div>

              <h3 className="font-bold mt-3">
                Profile
              </h3>

              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                Manage your account
              </p>

            </a>

            <a
              href="/favourites"
              className="bg-white border rounded-2xl p-5 hover:border-gray-500 hover:shadow-md transition"
            >

              <div className="text-3xl">
                ❤️
              </div>

              <h3 className="font-bold mt-3">
                Favourites
              </h3>

              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                Saved listings
              </p>

            </a>

            <a
              href="/messages"
              className="bg-white border rounded-2xl p-5 hover:border-gray-500 hover:shadow-md transition"
            >

              <div className="text-3xl">
                💬
              </div>

              <h3 className="font-bold mt-3">
                Messages
              </h3>

              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                Your conversations
              </p>

            </a>

          </div>

        </section>

      </div>

      {/* FOOTER */}

      <footer className="bg-gray-950 text-gray-400">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-7 flex flex-col sm:flex-row justify-between items-center gap-4">

          <div>

            <p className="text-white font-black text-xl">
              Sellio
            </p>

            <p className="text-xs mt-1">
              Buy. Sell. Discover.
            </p>

          </div>

          <div className="flex gap-6 text-sm">

            <a
              href="/"
              className="hover:text-white"
            >
              Home
            </a>

            <a
              href="/sell"
              className="hover:text-white"
            >
              Sell
            </a>

            <a
              href="/favourites"
              className="hover:text-white"
            >
              Favourites
            </a>

            <a
              href="/profile"
              className="hover:text-white"
            >
              Profile
            </a>

          </div>

        </div>

      </footer>

    </main>
  );
}

function ListingCard({
  item,
  promoted = false,
}: {
  item: Listing;
  promoted?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-400 transition">

      <div className="relative">

        {item.image ? (

          <img
            src={item.image}
            alt={item.title || "Listing"}
            className="w-full h-48 sm:h-52 lg:h-56 object-cover"
          />

        ) : (

          <div className="w-full h-48 sm:h-52 lg:h-56 bg-gray-200 flex items-center justify-center text-6xl">
            📷
          </div>

        )}

        {promoted && (

          <span className="absolute top-3 left-3 bg-gray-950 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">
            ★ PROMOTED
          </span>

        )}

      </div>

      <div className="p-4">

        <h3 className="font-bold text-base lg:text-lg line-clamp-2 min-h-[48px]">
          {item.title || "Untitled listing"}
        </h3>

        <p className="text-xl lg:text-2xl font-black mt-2">
          £{item.price || 0}
        </p>

        {item.location && (

          <p className="text-sm text-gray-500 mt-2 truncate">
            📍 {item.location}
          </p>

        )}

        {item.category && (

          <p className="text-xs text-gray-400 mt-1 truncate">
            {item.category}
          </p>

        )}

        <a
          href={`/listing?id=${item.id}`}
          className="block text-center mt-4 bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl text-sm font-bold"
        >
          View Listing
        </a>

      </div>

    </div>
  );
}