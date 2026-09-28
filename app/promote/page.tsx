"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Listing = {
  id: number;
  title: string;
  price: number | string;
  location: string | null;
  image: string | null;
  images: string[] | null;
  promoted: boolean;
  promoted_until: string | null;
};

const promotionOptions = [
  {
    days: 1,
    price: 1.99,
    label: "1 Day",
  },
  {
    days: 3,
    price: 4.99,
    label: "3 Days",
  },
  {
    days: 7,
    price: 9.99,
    label: "7 Days",
  },
];

export default function PromotedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] =
    useState<Listing | null>(null);

  const [selectedDays, setSelectedDays] = useState(1);

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

      if (userError || !user) {
        setError("You must be logged in.");
        return;
      }

      const { data, error: listingsError } =
        await supabase
          .from("listings")
          .select(`
            id,
            title,
            price,
            location,
            image,
            images,
            promoted,
            promoted_until
          `)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (listingsError) {
        console.error(listingsError);

        setError(
          listingsError.message
        );

        return;
      }

      setListings(
        (data || []) as Listing[]
      );
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while loading your listings."
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

  function isCurrentlyPromoted(
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

  async function startPromotion() {
    if (!selectedListing) {
      setError(
        "Please select a listing first."
      );

      return;
    }

    const selectedOption =
      promotionOptions.find(
        (option) =>
          option.days === selectedDays
      );

    if (!selectedOption) {
      setError(
        "Please select a promotion option."
      );

      return;
    }

    try {
      setCheckoutLoading(true);
      setError("");
      setMessage("");

      console.log(
        "Starting Stripe checkout..."
      );

      const response = await fetch(
        "/api/create-checkout-session",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title:
              `Promotion - ${selectedListing.title}`,

            price:
              selectedOption.price,

            listingId:
              selectedListing.id,

            days:
              selectedOption.days,
          }),
        }
      );

      console.log(
        "Stripe API status:",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "Stripe API response:",
        responseText
      );

      let data: {
        success?: boolean;
        url?: string | null;
        error?: string;
      };

      try {
        data =
          JSON.parse(responseText);
      } catch {
        throw new Error(
          `API returned invalid response. HTTP ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not create payment."
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe checkout URL was not returned."
        );
      }

      console.log(
        "Stripe checkout created."
      );

      window.location.href =
        data.url;
    } catch (err) {
      console.error(
        "Promotion error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not continue to payment."
      );

      setCheckoutLoading(false);
    }
  }

  const selectedOption =
    promotionOptions.find(
      (option) =>
        option.days === selectedDays
    );

  function goHome() {
    window.location.href = "/";
  }

  function goMyListings() {
    window.location.href =
      "/my-listings";
  }

  function goSell() {
    window.location.href = "/sell";
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* HEADER */}

      <header className="bg-gray-50 border-b border-gray-300 sticky top-0 z-50">

        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">

          <div className="flex items-center justify-between">

            {/* SELLIO */}

            <button
              type="button"
              onClick={goHome}
              className="text-2xl sm:text-3xl font-black text-gray-950 cursor-pointer"
            >
              Sellio
            </button>

            {/* MY LISTINGS */}

            <button
              type="button"
              onClick={goMyListings}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-sm"
            >
              ← My Listings
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* TITLE */}

        <div className="mb-8">

          <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500">
            Sellio Promotion
          </p>

          <h1 className="text-3xl sm:text-4xl font-black mt-2">
            Promote your listing
          </h1>

          <p className="text-gray-500 mt-2">
            Get more visibility by placing your listing
            higher in the marketplace.
          </p>

        </div>

        {/* ERROR */}

        {error && (

          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-4">

            <p className="font-bold">
              Something went wrong
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>

          </div>

        )}

        {/* MESSAGE */}

        {message && (

          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-4">
            {message}
          </div>

        )}

        {/* LOADING */}

        {loading ? (

          <div className="bg-white border border-gray-300 rounded-2xl p-12 text-center">

            <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-950 rounded-full animate-spin mx-auto" />

            <p className="mt-4 text-gray-500">
              Loading your listings...
            </p>

          </div>

        ) : listings.length === 0 ? (

          /* NO LISTINGS */

          <div className="bg-white border border-gray-300 rounded-2xl p-12 text-center">

            <div className="text-6xl">
              📦
            </div>

            <h2 className="text-2xl font-black mt-5">
              No listings found
            </h2>

            <p className="text-gray-500 mt-2">
              Create a listing first before promoting it.
            </p>

            <button
              type="button"
              onClick={goSell}
              className="inline-block mt-6 bg-gray-950 text-white px-6 py-3 rounded-xl font-bold"
            >
              + Create Listing
            </button>

          </div>

        ) : (

          /* LISTINGS */

          <div className="grid lg:grid-cols-3 gap-6">

            {/* LISTING LIST */}

            <div className="lg:col-span-2 space-y-4">

              <h2 className="text-xl font-black">
                Select a listing
              </h2>

              {listings.map(
                (listing) => {

                  const image =
                    getImage(listing);

                  const promoted =
                    isCurrentlyPromoted(
                      listing
                    );

                  const selected =
                    selectedListing?.id ===
                    listing.id;

                  return (

                    <button
                      key={listing.id}
                      type="button"
                      onClick={() =>
                        setSelectedListing(
                          listing
                        )
                      }
                      className={`w-full text-left bg-white border-2 rounded-2xl p-3 flex gap-4 transition ${
                        selected
                          ? "border-gray-950 shadow-lg"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >

                      {/* IMAGE */}

                      <div className="w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-gray-200">

                        {image ? (

                          <img
                            src={image}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />

                        ) : (

                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            📷
                          </div>

                        )}

                      </div>

                      {/* INFO */}

                      <div className="flex-1 min-w-0">

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <h3 className="font-black text-lg">
                              {listing.title}
                            </h3>

                            <p className="text-xl font-black mt-1">
                              £
                              {Number(
                                listing.price || 0
                              ).toLocaleString(
                                "en-GB"
                              )}
                            </p>

                          </div>

                          {selected && (

                            <span className="bg-gray-950 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                              Selected
                            </span>

                          )}

                        </div>

                        {listing.location && (

                          <p className="text-sm text-gray-500 mt-2">
                            📍{" "}
                            {listing.location}
                          </p>

                        )}

                        {promoted && (

                          <span className="inline-block mt-3 bg-orange-100 text-orange-700 text-xs font-black px-3 py-1 rounded-lg">
                            🚀 Currently Promoted
                          </span>

                        )}

                      </div>

                    </button>

                  );
                }
              )}

            </div>

            {/* PROMOTION */}

            <div className="lg:col-span-1">

              <div className="bg-white border border-gray-300 rounded-2xl p-5 sticky top-24">

                <h2 className="text-xl font-black">
                  Choose promotion
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Select how long you want your listing
                  promoted.
                </p>

                {/* OPTIONS */}

                <div className="space-y-3 mt-5">

                  {promotionOptions.map(
                    (option) => (

                      <button
                        key={option.days}
                        type="button"
                        onClick={() =>
                          setSelectedDays(
                            option.days
                          )
                        }
                        className={`w-full border-2 rounded-xl p-4 flex items-center justify-between transition ${
                          selectedDays ===
                          option.days
                            ? "border-gray-950 bg-gray-100"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >

                        <div className="text-left">

                          <p className="font-black">
                            {option.label}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            More visibility
                          </p>

                        </div>

                        <p className="text-lg font-black">
                          £
                          {option.price.toFixed(
                            2
                          )}
                        </p>

                      </button>

                    )
                  )}

                </div>

                {/* TOTAL */}

                <div className="border-t border-gray-200 mt-6 pt-5">

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Promotion
                    </span>

                    <span className="font-bold">
                      {selectedOption?.label}
                    </span>

                  </div>

                  <div className="flex justify-between mt-3">

                    <span className="font-black">
                      Total
                    </span>

                    <span className="text-2xl font-black">
                      £
                      {selectedOption?.price.toFixed(
                        2
                      )}
                    </span>

                  </div>

                </div>

                {/* PAYMENT */}

                <button
                  type="button"
                  onClick={startPromotion}
                  disabled={
                    !selectedListing ||
                    checkoutLoading
                  }
                  className="w-full mt-6 bg-gray-950 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-black transition"
                >
                  {checkoutLoading
                    ? "Redirecting to payment..."
                    : "Continue to Payment"}
                </button>

                {!selectedListing && (

                  <p className="text-xs text-gray-500 text-center mt-3">
                    Select a listing first.
                  </p>

                )}

                {/* BACK TO SELLIO */}

                <button
                  type="button"
                  onClick={goHome}
                  className="w-full mt-3 border-2 border-gray-200 hover:border-gray-400 bg-white text-gray-900 py-3.5 rounded-xl font-black transition"
                >
                  ← Back to Sellio
                </button>

              </div>

            </div>

          </div>

        )}

      </section>

    </main>
  );
}