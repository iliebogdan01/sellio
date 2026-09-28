"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Listing = {
  id: number;
  user_id: string;
  title: string;
  price: number;
  phone?: string | null;
  location?: string | null;
  category?: string | null;
  description?: string | null;
  image?: string | null;
  images?: string[] | null;
};

const categories = [
  "Cars",
  "Electronics",
  "Fashion",
  "Home",
  "Sports",
  "Jobs",
  "Other",
];

export default function EditListingPage() {
  const [listing, setListing] = useState<Listing | null>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadListing();
  }, []);

  async function loadListing() {
    try {
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams(
        window.location.search
      );

      const id = params.get("id");

      if (!id) {
        setMessage("Listing ID is missing.");
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Load listing error:", error);
        setMessage("Could not load this listing.");
        return;
      }

      if (!data) {
        setMessage("Listing not found.");
        return;
      }

      const currentListing = data as Listing;

      setListing(currentListing);

      setTitle(currentListing.title || "");

      setPrice(
        currentListing.price !== null &&
        currentListing.price !== undefined
          ? String(currentListing.price)
          : ""
      );

      setPhone(currentListing.phone || "");
      setLocation(currentListing.location || "");
      setCategory(currentListing.category || "");

      setDescription(
        currentListing.description || ""
      );

      setImage(currentListing.image || "");
    } catch (error) {
      console.error("Load listing error:", error);

      setMessage(
        "Could not load this listing."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const preview = URL.createObjectURL(file);

    setImage(preview);
  }

  async function saveChanges(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!listing) {
      return;
    }

    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter a title.");
      return;
    }

    if (!price.trim()) {
      setMessage("Please enter a price.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (!category) {
      setMessage("Please select a category.");
      return;
    }

    const numericPrice = Number(price);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setMessage("Please enter a valid price.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const { error } = await supabase
        .from("listings")
        .update({
          title: title.trim(),
          price: numericPrice,
          phone: phone.trim(),
          location:
            location.trim() || null,
          category:
            category || null,
          description:
            description.trim() || null,
          image: image || null,
        })
        .eq("id", listing.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Update listing error:",
          error
        );

        setMessage(error.message);
        return;
      }

      setMessage(
        "Listing updated successfully."
      );

      setTimeout(() => {
        window.location.href =
          `/listing?id=${encodeURIComponent(
            String(listing.id)
          )}`;
      }, 800);
    } catch (error) {
      console.error(
        "Update listing error:",
        error
      );

      setMessage(
        "Could not update the listing."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-[#333333] border-t-white rounded-full animate-spin mx-auto" />

          <p className="text-[#999999] mt-4">
            Loading listing...
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
                Profile
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

        <div className="max-w-4xl mx-auto">

          <div className="mb-8">

            <p className="text-xs uppercase tracking-[0.25em] text-[#777777] font-bold">
              Sellio Marketplace
            </p>

            <h1 className="text-4xl sm:text-5xl font-black mt-2">
              Edit Listing
            </h1>

            <p className="text-[#999999] mt-2">
              Update the details of your listing.
            </p>

          </div>

          {message && (
            <div className="mb-5 bg-[#202020] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-[#cccccc]">
              {message}
            </div>
          )}

          {!listing ? (

            <div className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-8 text-center">

              <p className="text-[#999999]">
                {message || "Listing not found."}
              </p>

              <a
                href="/my-listings"
                className="inline-block mt-5 bg-white text-black px-6 py-3 rounded-xl font-bold"
              >
                Back to My Listings
              </a>

            </div>

          ) : (

            <form
              onSubmit={saveChanges}
              className="bg-[#1b1b1b] border border-[#303030] rounded-2xl overflow-hidden"
            >

              <div className="p-6 sm:p-8">

                {/* TITLE */}

                <div>

                  <label className="block text-sm font-bold mb-2">
                    Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                  />

                </div>

                {/* PRICE + PHONE */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">

                  <div>

                    <label className="block text-sm font-bold mb-2">
                      Price (£)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) =>
                        setPrice(
                          event.target.value
                        )
                      }
                      disabled={saving}
                      className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-bold mb-2">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      disabled={saving}
                      className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                    />

                  </div>

                </div>

                {/* LOCATION + CATEGORY */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">

                  <div>

                    <label className="block text-sm font-bold mb-2">
                      Location
                    </label>

                    <input
                      type="text"
                      value={location}
                      onChange={(event) =>
                        setLocation(
                          event.target.value
                        )
                      }
                      disabled={saving}
                      className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-bold mb-2">
                      Category
                    </label>

                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target.value
                        )
                      }
                      disabled={saving}
                      className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                    >

                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="mt-5">

                  <label className="block text-sm font-bold mb-2">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    rows={7}
                    disabled={saving}
                    className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none resize-none focus:border-white disabled:opacity-50"
                  />

                </div>

                {/* IMAGE */}

                <div className="mt-5">

                  <label className="block text-sm font-bold mb-2">
                    Main Photo
                  </label>

                  {image ? (

                    <div className="relative rounded-xl overflow-hidden border border-[#303030]">

                      <img
                        src={image}
                        alt={title}
                        className="w-full h-64 object-cover"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setImage("")
                        }
                        disabled={saving}
                        className="absolute top-3 right-3 bg-[#0b0b0b]/90 border border-[#444444] text-white px-4 py-2 rounded-xl font-bold hover:bg-white hover:text-black transition disabled:opacity-50"
                      >
                        Remove
                      </button>

                    </div>

                  ) : (

                    <label className="block border border-dashed border-[#444444] hover:border-[#777777] bg-[#111111] rounded-xl p-8 text-center cursor-pointer transition">

                      <div className="text-3xl">
                        📷
                      </div>

                      <p className="font-bold mt-2">
                        Add a photo
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                        disabled={saving}
                        className="hidden"
                      />

                    </label>

                  )}

                </div>

              </div>

              {/* FORM FOOTER */}

              <div className="border-t border-[#303030] bg-[#171717] px-6 sm:px-8 py-5">

                <div className="flex flex-col sm:flex-row gap-3">

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-white hover:bg-gray-200 text-black px-7 py-3 rounded-xl font-black transition disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                  <a
                    href={`/listing?id=${encodeURIComponent(
                      String(listing.id)
                    )}`}
                    className="border border-[#444444] hover:bg-[#252525] px-7 py-3 rounded-xl font-bold text-center transition"
                  >
                    Cancel
                  </a>

                </div>

              </div>

            </form>

          )}

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-[#0b0b0b] border-t border-[#2b2b2b]">

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
                className="hover:text-white transition"
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