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

const categories = [
  { name: "Cars & Vehicles", icon: "🚗" },
  { name: "Property", icon: "🏠" },
  { name: "Electronics", icon: "📱" },
  { name: "Fashion", icon: "👕" },
  { name: "Home & Garden", icon: "🛋️" },
  { name: "Gaming", icon: "🎮" },
  { name: "Baby & Kids", icon: "👶" },
  { name: "Services", icon: "🔧" },
];

const defaultListings: Listing[] = [
  {
    id: 1,
    title: "iPhone 15 Pro 256GB",
    price: 650,
    location: "Nottingham",
    category: "Electronics",
    description: "Excellent condition iPhone 15 Pro.",
  },
  {
    id: 2,
    title: "BMW 3 Series 320d",
    price: 8995,
    location: "Birmingham",
    category: "Cars & Vehicles",
    description: "Well maintained BMW 3 Series.",
  },
  {
    id: 3,
    title: 'Samsung 55" 4K Smart TV',
    price: 350,
    location: "Manchester",
    category: "Electronics",
    description: "4K Smart TV in excellent condition.",
  },
  {
    id: 4,
    title: "Corner Sofa",
    price: 280,
    location: "Leicester",
    category: "Home & Garden",
    description: "Comfortable corner sofa.",
  },
];

export default function Home() {
  const [listings, setListings] =
    useState<Listing[]>(defaultListings);

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState("All categories");

  useEffect(() => {
    const saved = localStorage.getItem("sellio-listings");

    if (!saved) {
      return;
    }

    try {
      const savedListings = JSON.parse(saved);

      if (Array.isArray(savedListings)) {
        setListings([
          ...savedListings,
          ...defaultListings,
        ]);
      }
    } catch {
      console.log("Could not load saved listings.");
    }
  }, []);

  const filteredListings = listings.filter((item) => {
    const text = search.toLowerCase().trim();

    const matchesSearch =
      text === "" ||
      item.title.toLowerCase().includes(text) ||
      item.location.toLowerCase().includes(text) ||
      item.category.toLowerCase().includes(text);

    const matchesCategory =
      category === "All categories" ||
      item.category === category;

    return matchesSearch && matchesCategory;
  });

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    document
      .getElementById("listings")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}

      <header className="bg-white border-b">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <a
            href="/"
            className="text-3xl font-bold text-blue-600"
          >
            Sellio
          </a>

          <a
            href="/sell"
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            + Sell an item
          </a>

        </div>

      </header>

      {/* HERO */}

      <section className="bg-blue-600 text-white">

        <div className="max-w-7xl mx-auto px-6 py-16">

          <p className="text-blue-100 mb-4">
            🇬🇧 Marketplace for the UK
          </p>

          <h1 className="text-4xl md:text-6xl font-bold">
            Buy and sell locally across the UK
          </h1>

          <p className="text-blue-100 text-lg mt-5">
            Find great deals near you or sell things you no
            longer need.
          </p>

          <form
            onSubmit={handleSearch}
            className="bg-white p-2 rounded-2xl max-w-5xl mt-8 flex flex-col md:flex-row gap-2"
          >

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="What are you looking for?"
              className="flex-1 px-5 py-4 rounded-xl text-gray-900 outline-none"
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="px-5 py-4 rounded-xl text-gray-900 border"
            >

              <option value="All categories">
                All categories
              </option>

              {categories.map((item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name}
                </option>
              ))}

            </select>

            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold"
            >
              Search
            </button>

          </form>

        </div>

      </section>

      {/* CATEGORIES */}

      <section className="max-w-7xl mx-auto px-6 py-12">

        <h2 className="text-2xl font-bold mb-6">
          Browse categories
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">

          {categories.map((item) => (

            <button
              key={item.name}
              type="button"
              onClick={() => {
                setCategory(item.name);

                setTimeout(() => {
                  document
                    .getElementById("listings")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }, 50);
              }}
              className="bg-white border rounded-xl p-5 hover:border-blue-500 hover:shadow-md text-center"
            >

              <div className="text-3xl mb-3">
                {item.icon}
              </div>

              <div className="text-sm font-semibold">
                {item.name}
              </div>

            </button>

          ))}

        </div>

      </section>

      {/* LISTINGS */}

      <section
        id="listings"
        className="max-w-7xl mx-auto px-6 pb-16"
      >

        <h2 className="text-2xl font-bold">
          Recent listings
        </h2>

        <p className="text-gray-500 mt-1 mb-6">
          {filteredListings.length} listings found
        </p>

        {filteredListings.length === 0 ? (

          <div className="bg-white border rounded-2xl p-12 text-center">

            <div className="text-5xl">
              🔍
            </div>

            <h3 className="text-xl font-bold mt-4">
              No listings found
            </h3>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All categories");
              }}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl"
            >
              Clear search
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {filteredListings.map((item) => (

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

                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {item.description}
                  </p>

                  <p className="text-blue-600 font-semibold mt-4">
                    View listing →
                  </p>

                </div>

              </a>

            ))}

          </div>

        )}

      </section>

      {/* SELL BANNER */}

      <section className="max-w-7xl mx-auto px-6 pb-16">

        <div className="bg-blue-600 rounded-3xl p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">

          <div>

            <h2 className="text-3xl font-bold">
              Have something to sell?
            </h2>

            <p className="text-blue-100 mt-2">
              List your item on Sellio.
            </p>

          </div>

          <a
            href="/sell"
            className="bg-white text-blue-600 px-7 py-4 rounded-xl font-bold"
          >
            Start selling
          </a>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-gray-900 text-white">

        <div className="max-w-7xl mx-auto px-6 py-10">

          <h2 className="text-2xl font-bold">
            Sellio
          </h2>

          <p className="text-gray-400 mt-2">
            Buy. Sell. Local.
          </p>

          <p className="text-gray-500 text-sm mt-6">
            © 2026 Sellio
          </p>

        </div>

      </footer>

    </main>
  );
}