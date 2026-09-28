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
  user_id: string | null;
};

function ListingContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

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
    if (Array.isArray(item.images) && item.images.length > 0) {
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

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />

          <p className="mt-5 text-gray-500 font-medium">
            Loading listing...
          </p>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] text-gray-900 flex flex-col">

        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/"
              className="text-3xl font-black text-black"
            >
              Sellio
            </Link>
          </div>
        </header>

        <section className="flex-1 max-w-3xl w-full mx-auto px-4 py-16">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">

            <div className="text-6xl">
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
              className="inline-flex mt-7 bg-black text-white px-7 py-3 rounded-xl font-black hover:bg-gray-800"
            >
              ← Back to Sellio
            </Link>

          </div>
        </section>

        <footer className="bg-black text-gray-400 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <p className="text-white text-xl font-black">
              Sellio
            </p>
            <p className="text-xs mt-1">
              Buy. Sell. Discover.
            </p>
          </div>
        </footer>

      </main>
    );
  }

  const images = getImages(listing);

  const currentImage =
    images[selectedImage] || null;

  const isPromoted =
    listing.promoted &&
    listing.promoted_until &&
    new Date(listing.promoted_until).getTime() > Date.now();

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-gray-900 flex flex-col">

      {/* HEADER */}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">

          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

            <Link
              href="/"
              className="text-2xl sm:text-3xl font-black tracking-tight text-black"
            >
              Sellio
            </Link>

            <div className="flex items-center gap-2">

              <Link
                href="/"
                className="hidden sm:flex px-4 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-sm"
              >
                Home
              </Link>

              <Link
                href="/favourites"
                className="px-4 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-sm"
              >
                ❤️
                <span className="hidden sm:inline ml-2">
                  Favourites
                </span>
              </Link>

              <Link
                href="/messages"
                className="hidden sm:flex px-4 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-sm"
              >
                💬 Messages
              </Link>

              <Link
                href="/profile"
                className="hidden sm:flex px-4 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-sm"
              >
                👤 Profile
              </Link>

              <Link
                href="/sell"
                className="bg-black hover:bg-gray-800 text-white px-4 sm:px-5 py-2.5 rounded-xl font-black text-sm"
              >
                + Sell
              </Link>

            </div>

          </div>

        </div>

      </header>

      {/* MAIN CONTENT */}

      <section className="flex-1 w-full">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* BREADCRUMB */}

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">

            <Link
              href="/"
              className="hover:text-black"
            >
              Home
            </Link>

            <span>›</span>

            {listing.category && (
              <>
                <span>
                  {listing.category}
                </span>

                <span>›</span>
              </>
            )}

            <span className="text-gray-900 font-medium truncate">
              {listing.title}
            </span>

          </div>

          {/* PROMOTED */}

          {isPromoted && (
            <div className="mb-5">
              <span className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-black">
                🚀 PROMOTED LISTING
              </span>
            </div>
          )}

          {/* CONTENT */}

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] gap-6">

            {/* LEFT */}

            <div className="space-y-6">

              {/* IMAGE */}

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                <div className="bg-[#eeeeee] w-full">

                  {currentImage ? (
                    <div className="w-full h-[360px] sm:h-[500px] lg:h-[600px] flex items-center justify-center bg-gray-100">

                      <img
                        src={currentImage}
                        alt={listing.title}
                        className="w-full h-full object-contain"
                      />

                    </div>
                  ) : (
                    <div className="w-full h-[360px] sm:h-[500px] lg:h-[600px] flex items-center justify-center bg-gray-100 text-8xl">
                      📷
                    </div>
                  )}

                </div>

                {images.length > 1 && (
                  <div className="p-4 border-t border-gray-200">

                    <div className="flex gap-3 overflow-x-auto">

                      {images.map((src, index) => (

                        <button
                          key={`${src}-${index}`}
                          type="button"
                          onClick={() =>
                            setSelectedImage(index)
                          }
                          className={`shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition ${
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

                        </button>

                      ))}

                    </div>

                  </div>
                )}

              </div>

              {/* DESCRIPTION */}

              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-sm">

                <h2 className="text-xl sm:text-2xl font-black">
                  Description
                </h2>

                <div className="border-t border-gray-200 mt-5 pt-5">

                  <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                    {listing.description ||
                      "No description provided."}
                  </p>

                </div>

              </div>

              {/* LISTING INFORMATION */}

              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-sm">

                <h2 className="text-xl font-black">
                  Listing information
                </h2>

                <div className="grid sm:grid-cols-2 gap-5 mt-6">

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                      Category
                    </p>

                    <p className="font-bold mt-1">
                      {listing.category || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                      Location
                    </p>

                    <p className="font-bold mt-1">
                      {listing.location || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                      Posted
                    </p>

                    <p className="font-bold mt-1">
                      {formatDate(listing.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                      Listing ID
                    </p>

                    <p className="font-bold mt-1">
                      #{listing.id}
                    </p>
                  </div>

                </div>

              </div>

            </div>

            {/* RIGHT */}

            <aside>

              <div className="lg:sticky lg:top-24 space-y-5">

                {/* PRICE */}

                <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-sm">

                  {listing.category && (
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-black">
                      {listing.category}
                    </p>
                  )}

                  <h1 className="text-2xl sm:text-3xl font-black mt-2 leading-tight">
                    {listing.title}
                  </h1>

                  <p className="text-3xl sm:text-4xl font-black mt-5">
                    £{formatPrice(listing.price)}
                  </p>

                  {listing.location && (
                    <p className="text-gray-500 mt-4">
                      📍 {listing.location}
                    </p>
                  )}

                </div>

                {/* SELLER */}

                <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-sm">

                  <h2 className="text-xl font-black">
                    Seller
                  </h2>

                  <div className="flex items-center gap-3 mt-5">

                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                      👤
                    </div>

                    <div>
                      <p className="font-black">
                        Sellio Seller
                      </p>

                      <p className="text-sm text-gray-500">
                        Marketplace seller
                      </p>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href =
                        `/messages?listing=${encodeURIComponent(
                          String(listing.id)
                        )}`;
                    }}
                    className="w-full mt-6 bg-black hover:bg-gray-800 text-white py-4 rounded-xl font-black transition"
                  >
                    💬 Contact Seller
                  </button>

                  <button
                    type="button"
                    className="w-full mt-3 border-2 border-gray-200 hover:border-black bg-white py-4 rounded-xl font-black transition"
                  >
                    ♡ Add to Favourites
                  </button>

                </div>

                {/* SAFETY */}

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

                  <h3 className="font-black">
                    Stay safe
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-gray-600">

                    <p>
                      ✓ Meet in a safe public place
                    </p>

                    <p>
                      ✓ Check the item before paying
                    </p>

                    <p>
                      ✓ Never send money before checking the item
                    </p>

                  </div>

                </div>

                <Link
                  href="/sell"
                  className="block text-center bg-white border-2 border-gray-200 hover:border-black rounded-xl py-4 font-black transition"
                >
                  + Sell something
                </Link>

              </div>

            </aside>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-black text-gray-400 mt-auto">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="text-center sm:text-left">

              <p className="text-white text-xl font-black">
                Sellio
              </p>

              <p className="text-xs mt-1">
                Buy. Sell. Discover.
              </p>

            </div>

            <div className="flex flex-wrap justify-center gap-5 text-sm">

              <Link href="/" className="hover:text-white">
                Home
              </Link>

              <Link href="/sell" className="hover:text-white">
                Sell
              </Link>

              <Link
                href="/my-listings"
                className="hover:text-white"
              >
                My Listings
              </Link>

              <Link
                href="/favourites"
                className="hover:text-white"
              >
                Favourites
              </Link>

              <Link
                href="/messages"
                className="hover:text-white"
              >
                Messages
              </Link>

              <Link
                href="/profile"
                className="hover:text-white"
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
        <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">

          <div className="text-center">

            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />

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