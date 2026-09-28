"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

type Listing = {
  id: number;
  user_id: string;
  title: string;
  price: number | string;
  phone: string | null;
  location: string | null;
  category: string | null;
  description: string | null;
  image: string | null;
  images: string[] | null;
};

type ExistingImage = {
  url: string;
  path: string | null;
};

type UploadResult = {
  url: string;
  path: string;
};

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [listing, setListing] = useState<Listing | null>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [existingImages, setExistingImages] = useState<
    ExistingImage[]
  >([]);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setMessage("Listing ID is missing.");
      setLoading(false);
      return;
    }

    loadListing();

    return () => {
      newPreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadListing() {
    try {
      setLoading(true);
      setMessage("");
      setSuccess(false);

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const listingId = Number(id);

      if (!Number.isFinite(listingId)) {
        setMessage("Invalid listing ID.");
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Load listing error:", error);
        setMessage(
          error.message || "Could not load this listing."
        );
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
      setDescription(currentListing.description || "");

      const urls =
        Array.isArray(currentListing.images) &&
        currentListing.images.length > 0
          ? currentListing.images
          : currentListing.image
          ? [currentListing.image]
          : [];

      const parsedImages: ExistingImage[] = urls.map(
        (url) => ({
          url,
          path: getStoragePathFromUrl(url),
        })
      );

      setExistingImages(parsedImages);
    } catch (error) {
      console.error("Load listing error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load this listing."
      );
    } finally {
      setLoading(false);
    }
  }

  function getStoragePathFromUrl(
    url: string
  ): string | null {
    try {
      const marker =
        "/storage/v1/object/public/listing-images/";

      const index = url.indexOf(marker);

      if (index === -1) {
        return null;
      }

      return decodeURIComponent(
        url.substring(index + marker.length)
      );
    } catch {
      return null;
    }
  }

  function handleNewImages(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = event.target.files;

    if (!selectedFiles) {
      return;
    }

    const selected = Array.from(selectedFiles);

    const currentTotal =
      existingImages.length + newFiles.length;

    const remainingSlots = Math.max(
      0,
      6 - currentTotal
    );

    const filesToAdd = selected.slice(
      0,
      remainingSlots
    );

    if (filesToAdd.length === 0) {
      event.target.value = "";
      return;
    }

    const previews = filesToAdd.map((file) =>
      URL.createObjectURL(file)
    );

    setNewFiles((current) => [
      ...current,
      ...filesToAdd,
    ]);

    setNewPreviews((current) => [
      ...current,
      ...previews,
    ]);

    event.target.value = "";
  }

  function removeExistingImage(index: number) {
    setExistingImages((current) =>
      current.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  }

  function removeNewImage(index: number) {
    const preview = newPreviews[index];

    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }

    setNewFiles((current) =>
      current.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );

    setNewPreviews((current) =>
      current.filter(
        (_, previewIndex) =>
          previewIndex !== index
      )
    );
  }

  async function uploadNewImages(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    listingId: number
  ): Promise<UploadResult[]> {
    const uploaded: UploadResult[] = [];

    for (
      let index = 0;
      index < newFiles.length;
      index++
    ) {
      const file = newFiles[index];

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      const filePath =
        `${userId}/${listingId}/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("listing-images")
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                file.type,
            }
          );

      if (uploadError) {
        console.error(
          "Image upload error:",
          uploadError
        );

        throw new Error(
          `Could not upload image ${
            index + 1
          }: ${uploadError.message}`
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error(
          `Could not create URL for image ${
            index + 1
          }.`
        );
      }

      uploaded.push({
        url: publicUrlData.publicUrl,
        path: filePath,
      });
    }

    return uploaded;
  }

  async function saveChanges(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!listing) {
      return;
    }

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
      setMessage(
        "Please enter your phone number."
      );
      return;
    }

    if (!category) {
      setMessage(
        "Please select a category."
      );
      return;
    }

    const numericPrice = Number(price);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setMessage(
        "Please enter a valid price."
      );
      return;
    }

    const totalImages =
      existingImages.length +
      newFiles.length;

    if (totalImages > 6) {
      setMessage(
        "You can have a maximum of 6 photos."
      );
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
        router.push("/login");
        return;
      }

      let uploadedImages: UploadResult[] = [];

      if (newFiles.length > 0) {
        try {
          uploadedImages =
            await uploadNewImages(
              supabase,
              user.id,
              listing.id
            );
        } catch (uploadError) {
          console.error(
            "Upload failed:",
            uploadError
          );

          setMessage(
            uploadError instanceof Error
              ? uploadError.message
              : "Could not upload the new images."
          );

          return;
        }
      }

      const existingUrls =
        existingImages.map(
          (item) => item.url
        );

      const newUrls =
        uploadedImages.map(
          (item) => item.url
        );

      const finalImageUrls = [
        ...existingUrls,
        ...newUrls,
      ];

      const mainImage =
        finalImageUrls.length > 0
          ? finalImageUrls[0]
          : null;

      const { error: updateError } =
        await supabase
          .from("listings")
          .update({
            title: title.trim(),
            price: numericPrice,
            phone: phone.trim(),
            location:
              location.trim() || null,
            category: category || null,
            description:
              description.trim() || null,
            image: mainImage,
            images:
              finalImageUrls.length > 0
                ? finalImageUrls
                : null,
          })
          .eq("id", listing.id)
          .eq("user_id", user.id);

      if (updateError) {
        console.error(
          "Update listing error:",
          updateError
        );

        if (uploadedImages.length > 0) {
          await supabase.storage
            .from("listing-images")
            .remove(
              uploadedImages.map(
                (item) => item.path
              )
            );
        }

        setMessage(
          updateError.message ||
            "Could not update the listing."
        );

        return;
      }

      const currentOriginalUrls =
        Array.isArray(listing.images) &&
        listing.images.length > 0
          ? listing.images
          : listing.image
          ? [listing.image]
          : [];

      const remainingUrls =
        new Set(finalImageUrls);

      const removedUrls =
        currentOriginalUrls.filter(
          (url) =>
            !remainingUrls.has(url)
        );

      const removedPaths =
        removedUrls
          .map((url) =>
            getStoragePathFromUrl(url)
          )
          .filter(
            (
              path
            ): path is string =>
              Boolean(path)
          );

      if (removedPaths.length > 0) {
        const { error: removeError } =
          await supabase.storage
            .from("listing-images")
            .remove(
              removedPaths
            );

        if (removeError) {
          console.error(
            "Could not remove old images:",
            removeError
          );
        }
      }

      newPreviews.forEach(
        (preview) => {
          if (
            preview.startsWith("blob:")
          ) {
            URL.revokeObjectURL(
              preview
            );
          }
        }
      );

      setSuccess(true);

      setMessage(
        "Listing updated successfully."
      );

      setTimeout(() => {
        router.push(
          `/listing/${listing.id}`
        );
      }, 800);
    } catch (error) {
      console.error(
        "Update listing error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update the listing."
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

            <Link
              href="/"
              className="text-3xl font-black tracking-tight"
            >
              Sellio
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">

              <Link
                href="/"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                Home
              </Link>

              <Link
                href="/my-listings"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                My Listings
              </Link>

              <Link
                href="/profile"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                Profile
              </Link>

              <Link
                href="/sell"
                className="bg-white hover:bg-gray-200 text-black px-4 py-2.5 rounded-xl font-black transition"
              >
                + Sell
              </Link>

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
              Update the details and photos of your listing.
            </p>

          </div>

          {message && (
            <div
              className={`mb-5 rounded-xl px-4 py-3 text-sm border ${
                success
                  ? "bg-[#13251a] border-[#285c36] text-[#8ee5a1]"
                  : "bg-[#202020] border-[#3a3a3a] text-[#cccccc]"
              }`}
            >
              {message}
            </div>
          )}

          {!listing ? (
            <div className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-8 text-center">

              <p className="text-[#999999]">
                {message ||
                  "Listing not found."}
              </p>

              <Link
                href="/my-listings"
                className="inline-block mt-5 bg-white text-black px-6 py-3 rounded-xl font-bold"
              >
                Back to My Listings
              </Link>

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

                {/* PHOTOS */}

                <div className="mt-5">

                  <div className="flex items-center justify-between gap-3 mb-2">

                    <label className="block text-sm font-bold">
                      Photos
                    </label>

                    <span className="text-xs text-[#666666]">
                      {existingImages.length +
                        newFiles.length}
                      /6
                    </span>

                  </div>

                  {/* EXISTING */}

                  {existingImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                      {existingImages.map(
                        (item, index) => (
                          <div
                            key={`${item.url}-${index}`}
                            className="relative bg-[#111111] border border-[#303030] rounded-xl overflow-hidden"
                          >

                            <img
                              src={item.url}
                              alt={`Photo ${
                                index + 1
                              }`}
                              className="w-full h-32 object-cover"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeExistingImage(
                                  index
                                )
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

                  {/* NEW */}

                  {newPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">

                      {newPreviews.map(
                        (preview, index) => (
                          <div
                            key={`${preview}-${index}`}
                            className="relative bg-[#111111] border border-[#303030] rounded-xl overflow-hidden"
                          >

                            <img
                              src={preview}
                              alt={`New photo ${
                                index + 1
                              }`}
                              className="w-full h-32 object-cover"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeNewImage(
                                  index
                                )
                              }
                              disabled={saving}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#0b0b0b]/90 border border-[#444444] text-white hover:bg-white hover:text-black transition"
                            >
                              ×
                            </button>

                          </div>
                        )
                      )}

                    </div>
                  )}

                  {/* ADD */}

                  {existingImages.length +
                    newFiles.length <
                    6 && (
                    <label className="block mt-4 border border-dashed border-[#444444] hover:border-[#777777] bg-[#111111] rounded-xl p-8 text-center cursor-pointer transition">

                      <div className="text-3xl">
                        📷
                      </div>

                      <p className="font-bold mt-2">
                        Add photos
                      </p>

                      <p className="text-xs text-[#666666] mt-1">
                        Select up to{" "}
                        {6 -
                          existingImages.length -
                          newFiles.length}{" "}
                        more
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={
                          handleNewImages
                        }
                        disabled={saving}
                        className="hidden"
                      />

                    </label>
                  )}

                </div>

              </div>

              {/* FOOTER BUTTONS */}

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

                  <Link
                    href={`/listing/${listing.id}`}
                    className="border border-[#444444] hover:bg-[#252525] px-7 py-3 rounded-xl font-bold text-center transition"
                  >
                    Cancel
                  </Link>

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