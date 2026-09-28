"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

const categories = [
  "Cars & Vehicles",
  "Property",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Gaming",
  "Baby & Kids",
  "Services",
  "Other",
];

type SelectedImage = {
  file: File;
  preview: string;
};

export default function SellPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState<SelectedImage[]>([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleImages(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files;

    if (!files) {
      return;
    }

    const selectedFiles = Array.from(files);

    const remainingSlots = Math.max(
      0,
      6 - images.length
    );

    const filesToAdd = selectedFiles.slice(
      0,
      remainingSlots
    );

    const newImages = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((current) => [
      ...current,
      ...newImages,
    ]);

    event.target.value = "";
  }

  function removeImage(index: number) {
    const image = images[index];

    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }

    setImages((current) =>
      current.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  }

  async function uploadImages(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    listingId: number
  ) {
    const uploadedUrls: string[] = [];

    for (let index = 0; index < images.length; index++) {
      const selectedImage = images[index];

      const file = selectedImage.file;

      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const safeExtension =
        extension.replace(/[^a-z0-9]/g, "") ||
        "jpg";

      const fileName =
        `${Date.now()}-${index}-${crypto.randomUUID()}.${safeExtension}`;

      const filePath =
        `${userId}/${listingId}/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("listing-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        console.error(
          "Image upload error:",
          uploadError
        );

        throw new Error(
          `Could not upload image ${index + 1}: ${uploadError.message}`
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error(
          `Could not create public URL for image ${index + 1}.`
        );
      }

      uploadedUrls.push(
        publicUrlData.publicUrl
      );
    }

    return uploadedUrls;
  }

  async function createListing(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

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

      /*
       * STEP 1
       * Create the listing first.
       * We temporarily leave image/images empty.
       */

      const {
        data: listingData,
        error: listingError,
      } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          title: title.trim(),
          price: numericPrice,
          phone: phone.trim(),
          location:
            location.trim() || null,
          category:
            category || null,
          description:
            description.trim() || null,
          image: null,
          images: null,
          promoted: false,
          promoted_until: null,
        })
        .select()
        .single();

      if (listingError) {
        console.error(
          "Create listing error:",
          listingError
        );

        setMessage(
          listingError.message ||
            "Could not create listing."
        );

        return;
      }

      if (!listingData) {
        setMessage(
          "Listing could not be created."
        );

        return;
      }

      /*
       * STEP 2
       * Upload the selected images to Supabase Storage.
       */

      let uploadedUrls: string[] = [];

      try {
        if (images.length > 0) {
          uploadedUrls =
            await uploadImages(
              supabase,
              user.id,
              listingData.id
            );
        }
      } catch (uploadError) {
        console.error(
          "Upload images error:",
          uploadError
        );

        /*
         * If image upload fails, remove the
         * listing that was just created.
         */

        await supabase
          .from("listings")
          .delete()
          .eq("id", listingData.id)
          .eq("user_id", user.id);

        setMessage(
          uploadError instanceof Error
            ? uploadError.message
            : "Could not upload the images."
        );

        return;
      }

      /*
       * STEP 3
       * Save the real public image URLs
       * inside the listing.
       */

      if (uploadedUrls.length > 0) {
        const {
          error: updateError,
        } = await supabase
          .from("listings")
          .update({
            image: uploadedUrls[0],
            images: uploadedUrls,
          })
          .eq("id", listingData.id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error(
            "Update listing images error:",
            updateError
          );

          setMessage(
            `Listing was created, but the images could not be saved: ${updateError.message}`
          );

          return;
        }
      }

      setSuccess(true);
      setMessage(
        "Listing created successfully."
      );

      images.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });

      setTitle("");
      setPrice("");
      setPhone("");
      setLocation("");
      setCategory("");
      setDescription("");
      setImages([]);

      setTimeout(() => {
        window.location.href =
          `/listing?id=${encodeURIComponent(
            String(listingData.id)
          )}`;
      }, 800);
    } catch (error) {
      console.error(
        "Create listing error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the listing."
      );
    } finally {
      setSaving(false);
    }
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
                href="/favourites"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                Favourites
              </a>

              <a
                href="/profile"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                Profile
              </a>

              <a
                href="/sell"
                className="bg-white text-black px-4 py-2.5 rounded-xl font-black"
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
              Sell an item
            </h1>

            <p className="text-[#999999] mt-2">
              Create a listing and let buyers discover it.
            </p>

          </div>

          <form
            onSubmit={createListing}
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
                    setTitle(event.target.value)
                  }
                  placeholder="What are you selling?"
                  disabled={saving}
                  className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none placeholder:text-[#555555] focus:border-white disabled:opacity-50"
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
                      setPrice(event.target.value)
                    }
                    placeholder="0.00"
                    disabled={saving}
                    className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none placeholder:text-[#555555] focus:border-white disabled:opacity-50"
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
                      setPhone(event.target.value)
                    }
                    placeholder="e.g. 07123 456789"
                    disabled={saving}
                    className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none placeholder:text-[#555555] focus:border-white disabled:opacity-50"
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
                      setLocation(event.target.value)
                    }
                    placeholder="e.g. Nottingham"
                    disabled={saving}
                    className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none placeholder:text-[#555555] focus:border-white disabled:opacity-50"
                  />

                </div>

                <div>

                  <label className="block text-sm font-bold mb-2">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    disabled={saving}
                    className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                  >

                    <option value="">
                      Select category
                    </option>

                    {categories.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}

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
                  placeholder="Describe your item..."
                  rows={7}
                  disabled={saving}
                  className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none resize-none placeholder:text-[#555555] focus:border-white disabled:opacity-50"
                />

              </div>

              {/* IMAGES */}

              <div className="mt-5">

                <label className="block text-sm font-bold mb-2">
                  Photos
                </label>

                <label className="block border border-dashed border-[#444444] hover:border-[#777777] bg-[#111111] rounded-xl p-8 text-center cursor-pointer transition">

                  <div className="text-3xl">
                    📷
                  </div>

                  <p className="font-bold mt-2">
                    Add photos
                  </p>

                  <p className="text-xs text-[#666666] mt-1">
                    Select up to 6 images
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImages}
                    disabled={
                      saving ||
                      images.length >= 6
                    }
                    className="hidden"
                  />

                </label>

                {images.length > 0 && (

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">

                    {images.map(
                      (image, index) => (

                        <div
                          key={`${image.preview}-${index}`}
                          className="relative bg-[#111111] border border-[#303030] rounded-xl overflow-hidden"
                        >

                          <img
                            src={image.preview}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(index)
                            }
                            disabled={saving}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#0b0b0b]/90 border border-[#444444] text-white hover:bg-white hover:text-black transition"
                          >
                            ×
                          </button>

                          {index === 0 && (

                            <span className="absolute bottom-2 left-2 bg-[#0b0b0b]/90 border border-[#444444] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                              Main photo
                            </span>

                          )}

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

            {/* FORM FOOTER */}

            <div className="border-t border-[#303030] bg-[#171717] px-6 sm:px-8 py-5">

              {message && (

                <div
                  className={`mb-4 rounded-xl px-4 py-3 text-sm border ${
                    success
                      ? "bg-[#13251a] border-[#285c36] text-[#8ee5a1]"
                      : "bg-[#202020] border-[#3a3a3a] text-[#cccccc]"
                  }`}
                >
                  {message}
                </div>

              )}

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-white hover:bg-gray-200 text-black px-7 py-3 rounded-xl font-black transition disabled:opacity-50"
                >
                  {saving
                    ? "Publishing..."
                    : "Publish Listing"}
                </button>

                <a
                  href="/"
                  className="border border-[#444444] hover:bg-[#252525] px-7 py-3 rounded-xl font-bold text-center transition"
                >
                  Cancel
                </a>

              </div>

            </div>

          </form>

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
                className="text-white font-semibold"
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