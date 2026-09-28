"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const categoryIcons: Record<string, string> = {
  "Cars & Vehicles": "🚗",
  Property: "🏠",
  Electronics: "📱",
  Fashion: "👕",
  "Home & Garden": "🏡",
  Gaming: "🎮",
  "Baby & Kids": "🧸",
  Services: "🔧",
};

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    try {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        return;
      }

      if (!user) {
        setError("You must be logged in to see your listings.");
        return;
      }

      const { data, error: listingsError } = await supabase
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
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (listingsError) {
        console.error(listingsError);
        setError(listingsError.message);
        return;
      }

      setListings((data || []) as Listing[]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function getImages(listing: Listing): string[] {
    if (
      Array.isArray(listing.images) &&
      listing.images.length > 0
    ) {
      return listing.images.filter(
        (image) =>
          typeof image === "string" &&
          image.trim().length > 0
      );
    }

    if (listing.image) {
      return [listing.image];
    }

    return [];
  }

  function formatPrice(price: number | string) {
    return Number(price || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function isCurrentlyPromoted(listing: Listing) {
    if (
      !listing.promoted ||
      !listing.promoted_until
    ) {
      return false;
    }

    return (
      new Date(listing.promoted_until).getTime() >
      Date.now()
    );
  }

  async function deleteListing(listingId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error(deleteError);
        setError(deleteError.message);
        return;
      }

      setListings((current) =>
        current.filter(
          (listing) => listing.id !== listingId
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete listing."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white flex flex-col">

      {/* HEADER */}

      <header className="bg-[#080808] border-b border-[#292929] sticky top-0 z-50">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          <div className="flex items-center gap-3">

            <Link
              href="/"
              className="shrink-0 text-2xl sm:text-3xl font-black tracking-tight text-white hover:opacity-80 transition"
            >
              Sellio
            </Link>

            <div className="flex-1 flex justify-center">

              <Link
                href="/"
                className="hidden sm:flex w-full max-w-xl bg-[#151515] border border-[#333333] rounded-xl px-4 py-2.5 items-center gap-3 hover:border-[#555555] transition"
              >
                <span className="text-xl">
                  🔎
                </span>

                <span className="text-sm text-[#888888]">
                  What are you looking for?
                </span>
              </Link>

            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              <Link
                href="/favourites"
                title="Favourites"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-[#202020] text-lg transition"
              >
                ❤️
              </Link>

              <Link
                href="/messages"
                title="Messages"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-[#202020] text-lg transition"
              >
                💬
              </Link>

              <Link
                href="/profile"
                title="Profile"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-[#202020] text-lg transition"
              >
                👤
              </Link>

              <Link
                href="/sell"
                className="bg-white hover:bg-gray-200 text-black px-3 sm:px-5 py-2.5 rounded-xl font-black text-sm transition"
              >
                + Sell
              </Link>

            </div>

          </div>

        </div>

      </header>

      {/* CATEGORY BAR */}

      <section className="bg-[#0d0d0d] border-b border-[#292929]">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          <div className="flex gap-2 overflow-x-auto">

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-black"
            >
              🏠 Home
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              🚗 Cars
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              📱 Electronics
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              👕 Fashion
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              🏠 Property
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              🎮 Gaming
            </Link>

          </div>

        </div>

      </section>

      {/* MAIN */}

      <section className="flex-1 w-full px-3 sm:px-5 lg:px-7 py-8">

        <div className="w-full max-w-7xl mx-auto">

          {/* TITLE */}

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#777777]">
                Sellio Account
              </p>

              <h1 className="text-3xl sm:text-4xl font-black mt-2">
                My Listings
              </h1>

              <p className="text-[#888888] mt-2">
                Manage your products, edit them or promote them.
              </p>

            </div>

            <div className="bg-white text-black rounded-xl px-6 py-4 shadow-lg">

              <p className="text-xs uppercase tracking-wide font-bold text-gray-500">
                Total listings
              </p>

              <p className="text-3xl font-black mt-1">
                {listings.length}
              </p>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 bg-[#241414] border border-[#5a2929] text-[#ffb5b5] rounded-xl px-5 py-4">

              <p className="font-black">
                Something went wrong
              </p>

              <p className="text-sm mt-1">
                {error}
              </p>

            </div>
          )}

          {/* LOADING */}

          {loading ? (

            <div className="bg-[#181818] border border-[#303030] rounded-2xl p-16 text-center">

              <div className="w-11 h-11 border-4 border-[#333333] border-t-white rounded-full animate-spin mx-auto" />

              <p className="mt-4 text-[#888888]">
                Loading your listings...
              </p>

            </div>

          ) : listings.length === 0 ? (

            /* EMPTY */

            <div className="bg-[#181818] border border-[#303030] rounded-2xl p-12 text-center">

              <div className="text-7xl">
                📦
              </div>

              <h2 className="text-2xl font-black mt-5">
                You have no listings yet
              </h2>

              <p className="text-[#888888] mt-2 max-w-md mx-auto">
                Create your first listing and start selling on Sellio.
              </p>

              <Link
                href="/sell"
                className="inline-flex mt-6 bg-white hover:bg-gray-200 text-black px-7 py-3 rounded-xl font-black transition"
              >
                + Create Listing
              </Link>

            </div>

          ) : (

            /* LISTINGS */

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

              {listings.map((listing) => {

                const images = getImages(listing);

                const image =
                  images.length > 0
                    ? images[0]
                    : null;

                const promoted =
                  isCurrentlyPromoted(listing);

                const categoryIcon =
                  categoryIcons[
                    listing.category || ""
                  ] || "📦";

                return (

                  <article
                    key={listing.id}
                    className={`bg-[#181818] border rounded-2xl overflow-hidden hover:shadow-2xl transition ${
                      promoted
                        ? "border-orange-500/70"
                        : "border-[#303030] hover:border-[#555555]"
                    }`}
                  >

                    {/* IMAGE */}

                    <Link
                      href={`/listing?id=${encodeURIComponent(
                        String(listing.id)
                      )}`}
                      className="block relative group"
                    >

                      {image ? (

                        <div className="relative w-full h-56 bg-[#222222] overflow-hidden">

                          <img
                            src={image}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />

                          {images.length > 1 && (
                            <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                              📷 {images.length}
                            </span>
                          )}

                        </div>

                      ) : (

                        <div className="w-full h-56 bg-[#222222] flex items-center justify-center text-6xl">
                          📷
                        </div>

                      )}

                      {promoted && (
                        <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] uppercase tracking-wide font-black px-2.5 py-1 rounded-lg shadow-lg">
                          🚀 Promoted
                        </span>
                      )}

                    </Link>

                    {/* INFO */}

                    <div className="p-4">

                      {listing.category && (

                        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[#888888] font-bold truncate">

                          <span className="text-base">
                            {categoryIcon}
                          </span>

                          <span className="truncate">
                            {listing.category}
                          </span>

                        </div>

                      )}

                      <h2 className="font-black text-base mt-2 line-clamp-2 min-h-[48px] text-white">
                        {listing.title || "Untitled listing"}
                      </h2>

                      <p className="text-xl font-black mt-2 text-white">
                        £{formatPrice(listing.price)}
                      </p>

                      {listing.location && (

                        <p className="text-xs text-[#777777] mt-1.5 truncate">
                          📍 {listing.location}
                        </p>

                      )}

                      {/* ACTIONS */}

                      <div className="grid grid-cols-2 gap-2 mt-4">

                        <Link
                          href={`/listing?id=${encodeURIComponent(
                            String(listing.id)
                          )}`}
                          className="text-center bg-white hover:bg-gray-200 text-black py-2.5 rounded-xl text-sm font-black transition"
                        >
                          👁 View
                        </Link>

                        <Link
                          href={`/edit-listing?id=${encodeURIComponent(
                            String(listing.id)
                          )}`}
                          className="text-center bg-[#292929] hover:bg-[#353535] text-white py-2.5 rounded-xl text-sm font-bold transition"
                        >
                          ✏️ Edit
                        </Link>

                      </div>

                      {/* PROMOTE */}

                      <Link
                        href={`/promote?listing=${encodeURIComponent(
                          String(listing.id)
                        )}`}
                        className="block mt-2 bg-white hover:bg-gray-200 text-black text-center py-2.5 rounded-xl text-sm font-black transition"
                      >
                        🚀 Promote Listing
                      </Link>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          deleteListing(listing.id)
                        }
                        className="w-full mt-2 border border-[#552f2f] text-[#ff9b9b] hover:bg-[#291717] py-2.5 rounded-xl text-sm font-bold transition"
                      >
                        🗑 Delete Listing
                      </button>

                    </div>

                  </article>

                );
              })}

            </div>

          )}

        </div>

      </section>

      {/* CTA */}

      <section className="w-full px-3 sm:px-5 lg:px-7 pb-8">

        <div className="w-full max-w-7xl mx-auto bg-white text-black rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">

          <div>

            <p className="text-xl sm:text-2xl font-black">
              Have something else to sell?
            </p>

            <p className="text-gray-500 text-sm mt-1">
              Create another listing on Sellio.
            </p>

          </div>

          <Link
            href="/sell"
            className="bg-black hover:bg-[#222222] text-white px-6 py-3 rounded-xl font-black transition"
          >
            + Create Listing
          </Link>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-black text-gray-400 shrink-0 border-t border-gray-800">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="text-center sm:text-left">

              <p className="text-white text-xl font-black">
                Sellio
              </p>

              <p className="text-xs mt-1 text-gray-500">
                Buy. Sell. Discover.
              </p>

            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">

              <Link
                href="/"
                className="text-gray-400 hover:text-white transition"
              >
                Home
              </Link>

              <Link
                href="/sell"
                className="text-gray-400 hover:text-white transition"
              >
                Sell
              </Link>

              <Link
                href="/my-listings"
                className="text-white font-bold"
              >
                My Listings
              </Link>

              <Link
                href="/favourites"
                className="text-gray-400 hover:text-white transition"
              >
                Favourites
              </Link>

              <Link
                href="/messages"
                className="text-gray-400 hover:text-white transition"
              >
                Messages
              </Link>

              <Link
                href="/profile"
                className="text-gray-400 hover:text-white transition"
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