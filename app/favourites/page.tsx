"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Listing = {
  id: number;
  title: string;
  price: number;
  location: string | null;
  category: string | null;
  image: string | null;
  images: string[] | null;
  user_id: string;
  promoted: boolean;
  promoted_until: string | null;
};

type FavouriteRow = {
  id: number;
  listing_id: number;
  listings: Listing | null;
};

export default function FavouritesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    loadFavourites();
  }, []);

  async function loadFavourites() {
    try {
      setLoading(true);
      setMessage("");

      const supabase = createClient();

      /*
       * CURRENT USER
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      /*
       * LOAD FAVOURITES
       */

      const { data, error } = await supabase
        .from("favourites")
        .select(
          `
            id,
            listing_id,
            listings (
              id,
              title,
              price,
              location,
              category,
              image,
              images,
              user_id,
              promoted,
              promoted_until
            )
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Could not load favourites:",
          error
        );

        setMessage(
          "Could not load your favourites."
        );

        setLoading(false);
        return;
      }

      const rows = (data || []) as unknown as FavouriteRow[];

      const favouriteListings = rows
        .map((row) => row.listings)
        .filter(
          (listing): listing is Listing =>
            listing !== null
        );

      setListings(favouriteListings);
    } catch (error) {
      console.error(
        "Favourites page error:",
        error
      );

      setMessage(
        "Something went wrong while loading favourites."
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeFavourite(
    listingId: number
  ) {
    if (removing !== null) {
      return;
    }

    try {
      setRemoving(listingId);
      setMessage("");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { error } = await supabase
        .from("favourites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (error) {
        console.error(
          "Could not remove favourite:",
          error
        );

        setMessage(
          "Could not remove this favourite."
        );

        setRemoving(null);
        return;
      }

      setListings((current) =>
        current.filter(
          (listing) => listing.id !== listingId
        )
      );
    } catch (error) {
      console.error(
        "Remove favourite error:",
        error
      );

      setMessage(
        "Something went wrong while removing the favourite."
      );
    } finally {
      setRemoving(null);
    }
  }

  function getListingImage(
    listing: Listing
  ) {
    if (
      Array.isArray(listing.images) &&
      listing.images.length > 0
    ) {
      return listing.images[0];
    }

    if (listing.image) {
      return listing.image;
    }

    return null;
  }

  function isPromoted(
    listing: Listing
  ) {
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#111111] text-white flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-[#333333] border-t-white rounded-full animate-spin mx-auto" />

          <p className="text-[#999999] mt-4">
            Loading your favourites...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white flex flex-col">

      {/* HEADER */}

      <header className="bg-[#0b0b0b] border-b border-[#2b2b2b]">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">

          <div className="flex items-center justify-between gap-4">

            <a
              href="/"
              className="text-3xl font-black tracking-tight"
            >
              Sellio
            </a>

            <div className="flex items-center gap-2 sm:gap-3">

              <a
                href="/"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                Home
              </a>

              <a
                href="/my-listings"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                My Listings
              </a>

              <a
                href="/profile"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                Account
              </a>

              <a
                href="/sell"
                className="bg-white hover:bg-gray-200 text-black px-4 py-2.5 rounded-xl font-black transition"
              >
                + Sell
              </a>

            </div>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">

        <div className="max-w-6xl mx-auto">

          {/* TITLE */}

          <div className="mb-8">

            <p className="text-xs uppercase tracking-[0.25em] text-[#777777] font-bold">
              Saved items
            </p>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">

              <div>

                <h1 className="text-4xl sm:text-5xl font-black mt-2">
                  Favourites
                </h1>

                <p className="text-[#999999] mt-2">
                  Listings you have saved.
                </p>

              </div>

              <div className="text-[#777777] text-sm">
                {listings.length}{" "}
                {listings.length === 1
                  ? "saved item"
                  : "saved items"}
              </div>

            </div>

          </div>

          {/* MESSAGE */}

          {message && (
            <div className="mb-6 bg-[#202020] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-[#cccccc]">
              {message}
            </div>
          )}

          {/* EMPTY */}

          {listings.length === 0 ? (

            <section className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-8 sm:p-12 text-center">

              <div className="w-20 h-20 mx-auto rounded-full bg-[#111111] border border-[#303030] flex items-center justify-center text-4xl">
                ♡
              </div>

              <h2 className="text-2xl font-black mt-6">
                No favourites yet
              </h2>

              <p className="text-[#888888] mt-2 max-w-md mx-auto">
                When you save a listing, it will appear here.
              </p>

              <a
                href="/"
                className="inline-block mt-6 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-black transition"
              >
                Browse Listings
              </a>

            </section>

          ) : (

            /* LISTINGS */

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

              {listings.map((listing) => {

                const listingImage =
                  getListingImage(listing);

                const promoted =
                  isPromoted(listing);

                return (
                  <article
                    key={listing.id}
                    className="bg-[#1b1b1b] border border-[#303030] rounded-2xl overflow-hidden hover:border-[#555555] transition"
                  >

                    {/* IMAGE */}

                    <div className="relative">

                      {listingImage ? (

                        <img
                          src={listingImage}
                          alt={
                            listing.title ||
                            "Listing"
                          }
                          className="w-full h-56 object-cover bg-[#111111]"
                        />

                      ) : (

                        <div className="w-full h-56 bg-[#111111] flex items-center justify-center text-6xl">
                          📷
                        </div>

                      )}

                      {promoted && (
                        <span className="absolute top-3 left-3 bg-white text-black px-3 py-1.5 rounded-lg text-xs font-black">
                          🚀 Promoted
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeFavourite(
                            listing.id
                          )
                        }
                        disabled={
                          removing === listing.id
                        }
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-[#0b0b0b]/90 border border-[#444444] text-white flex items-center justify-center hover:bg-white hover:text-black transition disabled:opacity-50"
                        aria-label="Remove favourite"
                      >
                        {removing ===
                        listing.id
                          ? "..."
                          : "♥"}
                      </button>

                    </div>

                    {/* DETAILS */}

                    <div className="p-5">

                      {listing.category && (
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#666666] font-bold truncate">
                          {listing.category}
                        </p>
                      )}

                      <h2 className="font-black text-lg mt-1 line-clamp-2 min-h-[56px]">
                        {listing.title ||
                          "Untitled listing"}
                      </h2>

                      <p className="text-2xl font-black mt-3">
                        £
                        {Number(
                          listing.price || 0
                        ).toLocaleString(
                          "en-GB"
                        )}
                      </p>

                      {listing.location && (
                        <p className="text-sm text-[#777777] mt-2 truncate">
                          📍 {listing.location}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-5">

                        <a
                          href={`/listing?id=${encodeURIComponent(
                            String(
                              listing.id
                            )
                          )}`}
                          className="bg-white hover:bg-gray-200 text-black text-center py-2.5 rounded-xl text-sm font-black transition"
                        >
                          View
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            removeFavourite(
                              listing.id
                            )
                          }
                          disabled={
                            removing ===
                            listing.id
                          }
                          className="bg-[#111111] border border-[#3a3a3a] hover:bg-[#252525] text-white py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
                        >
                          Remove
                        </button>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

          )}

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-[#0b0b0b] border-t border-[#2b2b2b] mt-10">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-7">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            <div className="text-center sm:text-left">

              <p className="text-white font-black text-xl">
                Sellio
              </p>

              <p className="text-[#666666] text-xs mt-1">
                Buy. Sell. Discover.
              </p>

            </div>

            <div className="flex flex-wrap justify-center gap-5 text-sm text-[#888888]">

              <a
                href="/"
                className="hover:text-white transition"
              >
                Home
              </a>

              <a
                href="/sell"
                className="hover:text-white transition"
              >
                Sell
              </a>

              <a
                href="/my-listings"
                className="hover:text-white transition"
              >
                My Listings
              </a>

              <a
                href="/favourites"
                className="text-white font-semibold"
              >
                Favourites
              </a>

              <a
                href="/messages"
                className="hover:text-white transition"
              >
                Messages
              </a>

              <a
                href="/profile"
                className="hover:text-white transition"
              >
                Profile
              </a>

            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}