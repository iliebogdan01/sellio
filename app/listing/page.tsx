"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
        console.error(userError);
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

  function getImage(listing: Listing) {
    if (
      Array.isArray(listing.images) &&
      listing.images.length > 0
    ) {
      return listing.images[0];
    }

    return listing.image;
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

  function formatPrice(price: number | string) {
    const numericPrice = Number(price || 0);

    return numericPrice.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function deleteListing(listingId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) {
      return;
    }

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
    <main className="min-h-screen bg-[#111111] text-white">

      {/* HEADER */}

      <header className="bg-[#0b0b0b] border-b border-[#2b2b2b] sticky top-0 z-50">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">

          <div className="flex items-center justify-between gap-4">

            {/* LOGO */}

            <Link
              href="/"
              className="text-2xl sm:text-3xl font-black tracking-tight text-white hover:opacity-80 transition"
            >
              Sellio
            </Link>

            {/* NAVIGATION */}

            <div className="flex items-center gap-1 sm:gap-2">

              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#aaaaaa] hover:text-white hover:bg-[#1b1b1b] font-bold text-sm transition"
              >
                🏠
                <span>Home</span>
              </Link>

              <Link
                href="/favourites"
                className="flex items-center justify-center w-10 h-10 rounded-xl text-lg text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] transition"
                title="Favourites"
              >
                ❤️
              </Link>

              <Link
                href="/messages"
                className="flex items-center justify-center w-10 h-10 rounded-xl text-lg text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] transition"
                title="Messages"
              >
                💬
              </Link>

              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#aaaaaa] hover:text-white hover:bg-[#1b1b1b] font-bold text-sm transition"
              >
                👤
                <span>Profile</span>
              </Link>

              <Link
                href="/sell"
                className="bg-white hover:bg-gray-200 text-black px-4 sm:px-5 py-2.5 rounded-xl font-black text-sm transition"
              >
                + Sell
              </Link>

            </div>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* TITLE */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">

          <div>

            <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#777777]">
              Sellio
            </p>

            <h1 className="text-3xl sm:text-4xl font-black mt-2">
              My Listings
            </h1>

            <p className="text-[#888888] mt-2">
              Manage your listings, edit them and promote
              them to get more visibility.
            </p>

          </div>

          {/* TOTAL */}

          <div className="bg-[#1b1b1b] border border-[#303030] rounded-2xl px-6 py-4">

            <p className="text-xs uppercase tracking-wider text-[#777777] font-bold">
              Total listings
            </p>

            <p className="text-3xl font-black mt-1">
              {listings.length}
            </p>

          </div>

        </div>

        {/* ERROR */}

        {error && (

          <div className="mb-6 bg-[#251515] border border-[#553333] text-[#ffb3b3] rounded-2xl px-5 py-4">

            <p className="font-black">
              Something went wrong
            </p>

            <p className="text-sm mt-1 text-[#dd9999]">
              {error}
            </p>

          </div>

        )}

        {/* LOADING */}

        {loading ? (

          <div className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-16 text-center">

            <div className="w-11 h-11 border-4 border-[#333333] border-t-white rounded-full animate-spin mx-auto" />

            <p className="mt-5 text-[#888888]">
              Loading your listings...
            </p>

          </div>

        ) : listings.length === 0 ? (

          /* NO LISTINGS */

          <div className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-12 text-center">

            <div className="text-7xl">
              📦
            </div>

            <h2 className="text-2xl font-black mt-5">
              You have no listings yet
            </h2>

            <p className="text-[#888888] mt-2 max-w-md mx-auto">
              Create your first listing and start
              selling on Sellio.
            </p>

            <Link
              href="/sell"
              className="inline-flex mt-6 bg-white hover:bg-gray-200 text-black px-7 py-3.5 rounded-xl font-black transition"
            >
              + Create Listing
            </Link>

          </div>

        ) : (

          /* LISTINGS */

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

            {listings.map((listing) => {

              const image = getImage(listing);
              const promoted = isCurrentlyPromoted(listing);

              return (

                <article
                  key={listing.id}
                  className={`bg-[#1b1b1b] border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition ${
                    promoted
                      ? "border-orange-500/60 hover:border-orange-400"
                      : "border-[#303030] hover:border-[#555555]"
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
                        alt={listing.title}
                        className="w-full h-56 sm:h-60 object-cover"
                      />

                    ) : (

                      <div className="w-full h-56 sm:h-60 bg-[#111111] flex items-center justify-center text-6xl">
                        📷
                      </div>

                    )}

                    {promoted && (

                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-lg">
                        🚀 PROMOTED
                      </div>

                    )}

                  </Link>

                  {/* DETAILS */}

                  <div className="p-5">

                    {listing.category && (

                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#777777] font-bold truncate">
                        {listing.category}
                      </p>

                    )}

                    <h2 className="font-black text-xl leading-tight mt-1 line-clamp-2">
                      {listing.title}
                    </h2>

                    <p className="text-2xl font-black mt-3">
                      £{formatPrice(listing.price)}
                    </p>

                    {listing.location && (

                      <p className="text-sm text-[#888888] mt-2 truncate">
                        📍 {listing.location}
                      </p>

                    )}

                    {/* PROMOTION */}

                    {promoted &&
                      listing.promoted_until && (

                        <div className="mt-3 bg-[#241b12] border border-orange-500/30 rounded-xl px-3 py-2">

                          <p className="text-xs text-orange-400 font-bold">
                            🚀 Promoted until
                          </p>

                          <p className="text-xs text-[#999999] mt-1">
                            {new Date(
                              listing.promoted_until
                            ).toLocaleString("en-GB")}
                          </p>

                        </div>

                      )}

                    {/* VIEW + EDIT */}

                    <div className="grid grid-cols-2 gap-2 mt-5">

                      <Link
                        href={`/listing?id=${encodeURIComponent(
                          String(listing.id)
                        )}`}
                        className="text-center bg-white hover:bg-gray-200 text-black px-3 py-3 rounded-xl font-black text-sm transition"
                      >
                        👁️ View
                      </Link>

                      <Link
                        href={`/edit-listing/${encodeURIComponent(
                          String(listing.id)
                        )}`}
                        className="text-center bg-[#292929] hover:bg-[#333333] border border-[#404040] text-white px-3 py-3 rounded-xl font-black text-sm transition"
                      >
                        ✏️ Edit
                      </Link>

                    </div>

                    {/* PROMOTE */}

                    <Link
                      href={`/promote?listing=${encodeURIComponent(
                        String(listing.id)
                      )}`}
                      className="block text-center mt-2 bg-white hover:bg-gray-200 text-black px-3 py-3 rounded-xl font-black transition"
                    >
                      🚀 Promote Listing
                    </Link>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        deleteListing(listing.id)
                      }
                      className="w-full mt-2 bg-[#211515] border border-[#4b2929] text-[#ffaaaa] hover:bg-[#2c1919] px-3 py-3 rounded-xl font-bold text-sm transition"
                    >
                      🗑️ Delete Listing
                    </button>

                  </div>

                </article>

              );
            })}

          </div>

        )}

      </section>

      {/* FOOTER */}

      <footer className="bg-[#0b0b0b] border-t border-[#2b2b2b] mt-10">

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="text-center sm:text-left">

              <p className="text-white font-black text-xl">
                Sellio
              </p>

              <p className="text-[#666666] text-xs mt-1">
                Buy. Sell. Discover.
              </p>

            </div>

            <div className="flex flex-wrap justify-center gap-5 text-sm text-[#777777]">

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
                className="text-white font-bold"
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