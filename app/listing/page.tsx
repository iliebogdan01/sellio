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
  user_id?: string | null;
};

function ListingContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);
  const [favourite, setFavourite] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Listing ID is missing.");
      setLoading(false);
      return;
    }

    async function loadListing() {
      try {
        setLoading(true);
        setError("");

        const supabase = createClient();

        const { data, error: listingError } = await supabase
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
            created_at,
            user_id
          `)
          .eq("id", id)
          .single();

        if (listingError) {
          console.error(listingError);
          setError(listingError.message);
          setListing(null);
          return;
        }

        if (!data) {
          setError("Listing not found.");
          setListing(null);
          return;
        }

        setListing(data as Listing);
        setSelectedImage(0);
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

    loadListing();
  }, [id]);

  function getImages(item: Listing) {
    if (
      Array.isArray(item.images) &&
      item.images.length > 0
    ) {
      return item.images;
    }

    if (item.image) {
      return [item.image];
    }

    return [];
  }

  function formatPrice(price: number | string) {
    return Number(price || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function previousImage(total: number) {
    if (total <= 1) return;

    setSelectedImage((current) =>
      current === 0 ? total - 1 : current - 1
    );
  }

  function nextImage(total: number) {
    if (total <= 1) return;

    setSelectedImage((current) =>
      current === total - 1 ? 0 : current + 1
    );
  }

  function contactSeller() {
    if (!listing) return;

    window.location.href =
      `/messages?listing=${encodeURIComponent(
        String(listing.id)
      )}`;
  }

  function toggleFavourite() {
    setFavourite((current) => !current);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f4f4] text-[#111] flex items-center justify-center">
        <div className="text-center">
          <div className="w-11 h-11 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />

          <p className="mt-5 text-gray-500">
            Loading listing...
          </p>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-[#f4f4f4] text-[#111] flex flex-col">

        <header className="bg-white border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/"
              className="text-2xl sm:text-3xl font-black"
            >
              Sellio
            </Link>
          </div>
        </header>

        <section className="flex-1 max-w-3xl w-full mx-auto px-4 py-16">

          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">

            <div className="text-5xl">
              ⚠️
            </div>

            <h1 className="text-2xl font-black mt-5">
              Listing not found
            </h1>

            <p className="text-gray-500 mt-3">
              {error || "This listing does not exist."}
            </p>

            <Link
              href="/"
              className="inline-flex mt-7 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-black transition"
            >
              Back to Home
            </Link>

          </div>

        </section>

      </main>
    );
  }

  const images = getImages(listing);

  const currentImage =
    images[selectedImage] || null;

  const isPromoted =
    listing.promoted &&
    !!listing.promoted_until &&
    new Date(listing.promoted_until).getTime() >
      Date.now();

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#111] flex flex-col">

      {/* HEADER */}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">

          <div className="flex items-center gap-4">

            {/* LOGO */}

            <Link
              href="/"
              className="text-2xl sm:text-3xl font-black tracking-tight shrink-0"
            >
              Sellio
            </Link>

            {/* SEARCH */}

            <Link
              href="/"
              className="hidden md:flex flex-1 max-w-2xl mx-auto bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 items-center gap-3 hover:border-gray-400 transition"
            >
              <span className="text-lg">
                🔎
              </span>

              <span className="text-sm text-gray-500">
                Search for anything...
              </span>
            </Link>

            {/* NAV */}

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              <Link
                href="/favourites"
                title="Favourites"
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
              >
                ❤️
              </Link>

              <Link
                href="/messages"
                title="Messages"
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
              >
                💬
              </Link>

              <Link
                href="/profile"
                title="Profile"
                className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl hover:bg-gray-100 transition"
              >
                👤
              </Link>

              <Link
                href="/sell"
                className="bg-black hover:bg-gray-800 text-white px-4 sm:px-5 py-2.5 rounded-xl font-black text-sm transition"
              >
                + Sell
              </Link>

            </div>

          </div>

        </div>

      </header>

      {/* BREADCRUMBS */}

      <div className="w-full bg-white border-b border-gray-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">

            <Link
              href="/"
              className="text-gray-500 hover:text-black"
            >
              Home
            </Link>

            <span className="text-gray-400">
              /
            </span>

            {listing.category && (
              <>
                <Link
                  href="/"
                  className="text-gray-500 hover:text-black"
                >
                  {listing.category}
                </Link>

                <span className="text-gray-400">
                  /
                </span>
              </>
            )}

            <span className="font-semibold truncate">
              {listing.title}
            </span>

          </div>

        </div>

      </div>

      {/* MAIN */}

      <section className="flex-1 w-full">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

          {/* BACK */}

          <Link
            href="/"
            className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-black mb-5"
          >
            ← Back to listings
          </Link>

          {/* PRODUCT AREA */}

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">

            {/* LEFT - GALLERY */}

            <div className="min-w-0">

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                {/* MAIN PHOTO */}

                <div className="relative bg-[#111]">

                  {currentImage ? (

                    <div className="w-full min-h-[320px] sm:min-h-[500px] lg:min-h-[600px] max-h-[700px] flex items-center justify-center">

                      <img
                        src={currentImage}
                        alt={listing.title}
                        className="max-w-full max-h-[700px] w-auto h-auto object-contain"
                      />

                    </div>

                  ) : (

                    <div className="h-[400px] flex items-center justify-center text-7xl text-gray-500">
                      📷
                    </div>

                  )}

                  {/* PROMOTED */}

                  {isPromoted && (
                    <div className="absolute top-4 left-4 bg-black text-white px-3 py-2 rounded-lg text-xs font-black shadow-lg">
                      ★ PROMOTED
                    </div>
                  )}

                  {/* LEFT BUTTON */}

                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        previousImage(images.length)
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-black shadow-lg text-3xl flex items-center justify-center transition"
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                  )}

                  {/* RIGHT BUTTON */}

                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        nextImage(images.length)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-black shadow-lg text-3xl flex items-center justify-center transition"
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  )}

                  {/* COUNTER */}

                  {images.length > 0 && (
                    <div className="absolute bottom-4 right-4 bg-black/75 text-white px-3 py-2 rounded-lg text-xs font-bold">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}

                </div>

                {/* THUMBNAILS */}

                {images.length > 1 && (

                  <div className="p-3 sm:p-4 border-t border-gray-200">

                    <div className="flex gap-3 overflow-x-auto">

                      {images.map(
                        (src, index) => (

                          <button
                            key={`${src}-${index}`}
                            type="button"
                            onClick={() =>
                              setSelectedImage(index)
                            }
                            className={`relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition ${
                              selectedImage === index
                                ? "border-black"
                                : "border-transparent hover:border-gray-400"
                            }`}
                          >

                            <img
                              src={src}
                              alt={`${listing.title} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {selectedImage === index && (
                              <div className="absolute inset-0 ring-2 ring-inset ring-black" />
                            )}

                          </button>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>

              {/* DESCRIPTION */}

              <div className="bg-white border border-gray-200 rounded-2xl mt-6 p-5 sm:p-7 shadow-sm">

                <h2 className="text-xl sm:text-2xl font-black">
                  Description
                </h2>

                <div className="h-px bg-gray-200 my-5" />

                <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                  {listing.description ||
                    "No description provided."}
                </p>

              </div>

              {/* LISTING INFORMATION */}

              <div className="bg-white border border-gray-200 rounded-2xl mt-6 p-5 sm:p-7 shadow-sm">

                <h2 className="text-xl font-black">
                  Listing information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

                  <div className="bg-gray-50 rounded-xl p-4">

                    <p className="text-xs uppercase tracking-wide text-gray-500 font-bold">
                      Category
                    </p>

                    <p className="font-bold mt-1">
                      {listing.category ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">

                    <p className="text-xs uppercase tracking-wide text-gray-500 font-bold">
                      Location
                    </p>

                    <p className="font-bold mt-1">
                      {listing.location ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">

                    <p className="text-xs uppercase tracking-wide text-gray-500 font-bold">
                      Posted
                    </p>

                    <p className="font-bold mt-1">
                      {new Date(
                        listing.created_at
                      ).toLocaleDateString("en-GB")}
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">

                    <p className="text-xs uppercase tracking-wide text-gray-500 font-bold">
                      Listing ID
                    </p>

                    <p className="font-bold mt-1">
                      #{listing.id}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* RIGHT - LISTING DETAILS */}

            <aside className="lg:sticky lg:top-24 h-fit">

              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">

                {/* CATEGORY */}

                {listing.category && (
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500 font-black">
                    {listing.category}
                  </p>
                )}

                {/* TITLE */}

                <h1 className="text-2xl sm:text-3xl font-black leading-tight mt-2">
                  {listing.title}
                </h1>

                {/* PRICE */}

                <p className="text-3xl sm:text-4xl font-black mt-5">
                  £{formatPrice(listing.price)}
                </p>

                {/* LOCATION */}

                {listing.location && (
                  <p className="text-gray-500 mt-4 flex items-center gap-2">
                    <span>
                      📍
                    </span>

                    <span>
                      {listing.location}
                    </span>
                  </p>
                )}

                <div className="h-px bg-gray-200 my-6" />

                {/* SELLER */}

                <div>

                  <h2 className="text-lg font-black">
                    Seller
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Contact the seller about this listing.
                  </p>

                </div>

                {/* CONTACT */}

                <button
                  type="button"
                  onClick={contactSeller}
                  className="w-full mt-5 bg-black hover:bg-gray-800 text-white py-3.5 rounded-xl font-black transition"
                >
                  💬 Contact Seller
                </button>

                {/* FAVOURITE */}

                <button
                  type="button"
                  onClick={toggleFavourite}
                  className={`w-full mt-3 py-3.5 rounded-xl font-black border-2 transition ${
                    favourite
                      ? "bg-red-50 border-red-300 text-red-600"
                      : "bg-white border-gray-200 hover:border-gray-400 text-black"
                  }`}
                >
                  {favourite
                    ? "♥ Saved to Favourites"
                    : "♡ Add to Favourites"}
                </button>

                {/* SELL */}

                <Link
                  href="/sell"
                  className="block w-full mt-3 text-center bg-gray-100 hover:bg-gray-200 text-black py-3.5 rounded-xl font-black transition"
                >
                  + Sell something
                </Link>

                {/* SAFETY */}

                <div className="mt-6 bg-gray-50 rounded-xl p-4">

                  <p className="font-black text-sm">
                    🛡️ Stay safe
                  </p>

                  <p className="text-xs text-gray-500 mt-2 leading-5">
                    Never send money before checking the item
                    and seller. Meet in a safe place when possible.
                  </p>

                </div>

              </div>

              {/* SHARE */}

              <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-5 shadow-sm">

                <p className="font-black">
                  Share this listing
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        window.location.href
                      );

                      alert(
                        "Listing link copied."
                      );
                    } catch {
                      alert(
                        "Could not copy the listing link."
                      );
                    }
                  }}
                  className="w-full mt-3 border-2 border-gray-200 hover:border-gray-400 py-3 rounded-xl font-bold transition"
                >
                  🔗 Copy Listing Link
                </button>

              </div>

            </aside>

          </div>

        </div>

      </section>

      {/* MOBILE CONTACT BAR */}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">

        <div className="flex gap-2 max-w-7xl mx-auto">

          <button
            type="button"
            onClick={toggleFavourite}
            className={`w-14 h-12 rounded-xl border-2 flex items-center justify-center text-xl ${
              favourite
                ? "border-red-300 bg-red-50 text-red-600"
                : "border-gray-200 bg-white text-black"
            }`}
            aria-label="Favourite"
          >
            {favourite ? "♥" : "♡"}
          </button>

          <button
            type="button"
            onClick={contactSeller}
            className="flex-1 h-12 rounded-xl bg-black hover:bg-gray-800 text-white font-black"
          >
            💬 Contact Seller
          </button>

        </div>

      </div>

      {/* FOOTER */}

      <footer className="bg-[#080808] text-white mt-10 pb-20 lg:pb-0">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="text-center sm:text-left">

              <p className="font-black text-xl">
                Sellio
              </p>

              <p className="text-gray-500 text-xs mt-1">
                Buy. Sell. Discover.
              </p>

            </div>

            <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-500">

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

export default function ListingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f4f4f4] text-black flex items-center justify-center">

          <div className="text-center">

            <div className="w-11 h-11 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />

            <p className="mt-5 text-gray-500">
              Loading...
            </p>

          </div>

        </main>
      }
    >
      <ListingContent />
    </Suspense>
  );
}