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

function ListingPageContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("id");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);
  const [favouriteChecking, setFavouriteChecking] = useState(true);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) {
        setError("Listing ID is missing.");
        setLoading(false);
        setFavouriteChecking(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const supabase = createClient();

        const { data, error: supabaseError } = await supabase
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
          .eq("id", listingId)
          .maybeSingle();

        if (supabaseError) {
          console.error("Supabase error:", supabaseError);
          setError(supabaseError.message);
          setListing(null);
          setFavouriteChecking(false);
          return;
        }

        if (!data) {
          setError("This listing could not be found.");
          setListing(null);
          setFavouriteChecking(false);
          return;
        }

        const loadedListing = data as Listing;

        setListing(loadedListing);
        setSelectedImage(0);

        /*
         * CHECK IF LISTING IS ALREADY A FAVOURITE
         */

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: favourite, error: favouriteError } =
            await supabase
              .from("favourites")
              .select("id")
              .eq("user_id", user.id)
              .eq("listing_id", loadedListing.id)
              .maybeSingle();

          if (favouriteError) {
            console.error(
              "Could not check favourite:",
              favouriteError
            );

            setIsFavourite(false);
          } else {
            setIsFavourite(!!favourite);
          }
        } else {
          setIsFavourite(false);
        }
      } catch (err) {
        console.error("Listing error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the listing."
        );
      } finally {
        setLoading(false);
        setFavouriteChecking(false);
      }
    }

    loadListing();
  }, [listingId]);

  /*
   * ADD / REMOVE FAVOURITE
   */

  async function toggleFavourite() {
    if (!listing || favouriteLoading) {
      return;
    }

    try {
      setFavouriteLoading(true);

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      /*
       * REMOVE FAVOURITE
       */

      if (isFavourite) {
        const { error: deleteError } = await supabase
          .from("favourites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listing.id);

        if (deleteError) {
          console.error(
            "Could not remove favourite:",
            deleteError
          );

          alert(
            "Could not remove this listing from favourites."
          );

          return;
        }

        setIsFavourite(false);
        return;
      }

      /*
       * ADD FAVOURITE
       */

      const { data: existingFavourite, error: checkError } =
        await supabase
          .from("favourites")
          .select("id")
          .eq("user_id", user.id)
          .eq("listing_id", listing.id)
          .maybeSingle();

      if (checkError) {
        console.error(
          "Could not check existing favourite:",
          checkError
        );

        alert(
          "Could not save this listing to favourites."
        );

        return;
      }

      /*
       * Prevent duplicate favourites
       */

      if (existingFavourite) {
        setIsFavourite(true);
        return;
      }

      const { error: insertError } = await supabase
        .from("favourites")
        .insert({
          user_id: user.id,
          listing_id: listing.id,
        });

      if (insertError) {
        console.error(
          "Could not add favourite:",
          insertError
        );

        alert(
          "Could not save this listing to favourites."
        );

        return;
      }

      setIsFavourite(true);
    } catch (error) {
      console.error(
        "Favourite action error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setFavouriteLoading(false);
    }
  }

  function getImages(item: Listing): string[] {
    const result: string[] = [];

    if (Array.isArray(item.images)) {
      for (const image of item.images) {
        if (
          typeof image === "string" &&
          image.trim() !== "" &&
          !result.includes(image)
        ) {
          result.push(image);
        }
      }
    }

    if (
      typeof item.image === "string" &&
      item.image.trim() !== "" &&
      !result.includes(item.image)
    ) {
      result.push(item.image);
    }

    return result;
  }

  function formatPrice(price: number | string) {
    const value = Number(price);

    if (Number.isNaN(value)) {
      return "0.00";
    }

    return value.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(date: string) {
    if (!date) {
      return "Unknown";
    }

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function isPromoted(item: Listing) {
    if (!item.promoted || !item.promoted_until) {
      return false;
    }

    return (
      new Date(item.promoted_until).getTime() >
      Date.now()
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-gray-200 border-t-black animate-spin" />

          <p className="mt-5 text-gray-500 font-semibold">
            Loading listing...
          </p>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] text-gray-900">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <Link
              href="/"
              className="text-3xl font-black text-black no-underline"
            >
              Sellio
            </Link>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="text-6xl">⚠️</div>

            <h1 className="text-2xl font-black mt-5">
              Listing not found
            </h1>

            <p className="text-gray-500 mt-3">
              {error || "This listing does not exist."}
            </p>

            <Link
              href="/"
              className="inline-flex mt-7 bg-black text-white px-7 py-3 rounded-xl font-black no-underline hover:bg-gray-800 transition"
            >
              ← Back to Sellio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const images = getImages(listing);

  const currentImage =
    images[selectedImage] || images[0] || null;

  const promoted = isPromoted(listing);

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-gray-900">

      {/* HEADER */}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">

            <Link
              href="/"
              className="shrink-0 text-2xl sm:text-3xl font-black tracking-tight text-black no-underline"
            >
              Sellio
            </Link>

            <div className="flex-1" />

            <nav className="flex items-center gap-1 sm:gap-2 shrink-0">

              <Link
                href="/"
                className="hidden sm:flex items-center px-4 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-sm transition no-underline text-black"
              >
                Home
              </Link>

              <Link
                href="/favourites"
                className="flex items-center px-3 sm:px-4 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-sm transition no-underline text-black"
              >
                <span>❤️</span>

                <span className="hidden sm:inline ml-2">
                  Favourites
                </span>
              </Link>

              <Link
                href="/messages"
                className="hidden sm:flex items-center px-4 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-sm transition no-underline text-black"
              >
                💬
                <span className="ml-2">
                  Messages
                </span>
              </Link>

              <Link
                href="/profile"
                className="hidden sm:flex items-center px-4 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-sm transition no-underline text-black"
              >
                👤
                <span className="ml-2">
                  Profile
                </span>
              </Link>

              <Link
                href="/sell"
                className="ml-1 bg-black hover:bg-gray-800 text-white px-4 sm:px-5 py-2.5 rounded-xl font-black text-sm transition no-underline"
              >
                + Sell
              </Link>

            </nav>
          </div>
        </div>
      </header>

      {/* PAGE */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* BREADCRUMB */}

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-hidden">

          <Link
            href="/"
            className="hover:text-black no-underline text-gray-500 shrink-0"
          >
            Home
          </Link>

          <span>›</span>

          {listing.category && (
            <>
              <span className="shrink-0">
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

        {promoted && (
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-black">
              🚀 PROMOTED
            </span>
          </div>
        )}

        {/* CONTENT */}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] gap-6">

          {/* LEFT */}

          <div className="space-y-6">

            {/* GALLERY */}

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

              <div className="relative bg-[#eeeeee]">

                {currentImage ? (
                  <div className="w-full h-[380px] sm:h-[520px] lg:h-[600px] flex items-center justify-center bg-[#eeeeee]">

                    <img
                      src={currentImage}
                      alt={listing.title}
                      className="max-w-full max-h-full w-full h-full object-contain"
                    />

                  </div>
                ) : (
                  <div className="w-full h-[380px] sm:h-[520px] lg:h-[600px] flex items-center justify-center text-8xl bg-gray-100">
                    📷
                  </div>
                )}

                {images.length > 0 && (
                  <div className="absolute bottom-4 right-4 bg-black/75 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                    {selectedImage + 1} / {images.length}
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          selectedImage === 0
                            ? images.length - 1
                            : selectedImage - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-xl transition"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          selectedImage === images.length - 1
                            ? 0
                            : selectedImage + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-xl transition"
                    >
                      ›
                    </button>
                  </>
                )}

              </div>

              {images.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-3 overflow-x-auto pb-1">

                    {images.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(index)}
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
                          <div className="absolute inset-0 bg-black/10" />
                        )}
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

            {/* INFORMATION */}

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
                    {listing.category ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Location
                  </p>

                  <p className="font-bold mt-1">
                    {listing.location ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Posted
                  </p>

                  <p className="font-bold mt-1">
                    {formatDate(
                      listing.created_at
                    )}
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

              {/* PRODUCT INFO */}

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

                <Link
                  href={`/messages?listing=${encodeURIComponent(
                    String(listing.id)
                  )}`}
                  className="block w-full mt-6 bg-black hover:bg-gray-800 text-white text-center py-4 rounded-xl font-black transition no-underline"
                >
                  💬 Contact Seller
                </Link>

                {/* FAVOURITE BUTTON */}

                <button
                  type="button"
                  onClick={toggleFavourite}
                  disabled={
                    favouriteLoading ||
                    favouriteChecking
                  }
                  className={`w-full mt-3 py-4 rounded-xl font-black transition border-2 flex items-center justify-center gap-2 ${
                    isFavourite
                      ? "bg-black text-white border-black hover:bg-gray-800"
                      : "bg-white text-black border-gray-200 hover:border-black"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {favouriteLoading ? (
                    <>
                      <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : favouriteChecking ? (
                    "Checking..."
                  ) : isFavourite ? (
                    <>
                      ❤️ Remove from Favourites
                    </>
                  ) : (
                    <>
                      ♡ Add to Favourites
                    </>
                  )}
                </button>

              </div>

              {/* SAFETY */}

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

                <h3 className="font-black">
                  Stay safe
                </h3>

                <div className="mt-4 space-y-3 text-sm text-gray-600">

                  <p>✓ Meet in a safe public place</p>

                  <p>✓ Check the item before paying</p>

                  <p>
                    ✓ Never send money before checking the item
                  </p>

                </div>
              </div>

              {/* SELL */}

              <Link
                href="/sell"
                className="block text-center bg-white border-2 border-gray-200 hover:border-black rounded-xl py-4 font-black transition no-underline text-black"
              >
                + Sell something
              </Link>

            </div>
          </aside>

        </div>
      </div>

      {/* FOOTER */}

      <footer className="bg-black text-gray-400 mt-12 border-t border-gray-800">

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
                className="text-gray-400 hover:text-white transition no-underline"
              >
                Home
              </Link>

              <Link
                href="/sell"
                className="text-gray-400 hover:text-white transition no-underline"
              >
                Sell
              </Link>

              <Link
                href="/my-listings"
                className="text-gray-400 hover:text-white transition no-underline"
              >
                My Listings
              </Link>

              <Link
                href="/favourites"
                className="text-gray-400 hover:text-white transition no-underline"
              >
                Favourites
              </Link>

              <Link
                href="/messages"
                className="text-gray-400 hover:text-white transition no-underline"
              >
                Messages
              </Link>

              <Link
                href="/profile"
                className="text-gray-400 hover:text-white transition no-underline"
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
            <div className="mx-auto h-12 w-12 rounded-full border-4 border-gray-200 border-t-black animate-spin" />

            <p className="mt-5 text-gray-500 font-semibold">
              Loading listing...
            </p>
          </div>
        </main>
      }
    >
      <ListingPageContent />
    </Suspense>
  );
}