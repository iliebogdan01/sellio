
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "iliebogdan01@yahoo.com";

type Listing = {
  id: number;
  title: string | null;
  price: number | string | null;
  location: string | null;
  category: string | null;
  promoted: boolean | null;
  promoted_until: string | null;
  created_at: string | null;
  user_id: string | null;
};

function formatPrice(price: number | string | null) {
  return `£${Number(price ?? 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isPromoted(listing: Listing) {
  return Boolean(
    listing.promoted &&
      listing.promoted_until &&
      new Date(listing.promoted_until).getTime() > Date.now()
  );
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, title, price, location, category, promoted, promoted_until, created_at, user_id"
    )
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as Listing[];
  const activePromotions = listings.filter(isPromoted).length;

  return (
    <main className="min-h-screen bg-[#111111] text-white">
      <header className="sticky top-0 z-50 border-b border-[#303030] bg-[#080808]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link href="/admin" className="text-3xl font-black">
            Sellio <span className="text-gray-500">Admin</span>
          </Link>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://sellio.website"
              className="rounded-xl bg-white px-4 py-2 font-bold text-black hover:bg-gray-200"
            >
              Open Sellio
            </a>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-xl bg-[#242424] px-4 py-2 font-bold hover:bg-[#333333]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
          Sellio Administration
        </p>

        <h1 className="mt-2 text-4xl font-black">Admin Dashboard</h1>

        <p className="mt-3 text-gray-400">
          Signed in as {user.email}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#303030] bg-[#191919] p-6">
            <p className="text-sm text-gray-400">Total listings</p>
            <p className="mt-2 text-4xl font-black">{listings.length}</p>
          </div>

          <div className="rounded-2xl border border-[#303030] bg-[#191919] p-6">
            <p className="text-sm text-gray-400">Active promotions</p>
            <p className="mt-2 text-4xl font-black">{activePromotions}</p>
          </div>

          <div className="rounded-2xl border border-[#303030] bg-[#191919] p-6">
            <p className="text-sm text-gray-400">Admin status</p>
            <p className="mt-2 text-2xl font-black text-green-400">
              Authenticated
            </p>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-[#303030] bg-[#191919]">
          <div className="border-b border-[#303030] p-5">
            <h2 className="text-xl font-black">All listings</h2>
            <p className="mt-1 text-sm text-gray-400">
              All listings available to this Supabase session.
            </p>
          </div>

          {error ? (
            <div className="p-6 text-red-300">
              <p className="font-bold">Could not load listings.</p>
              <p className="mt-2 text-sm">{error.message}</p>
            </div>
          ) : listings.length === 0 ? (
            <p className="p-8 text-gray-400">No listings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#222222] text-gray-300">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Listing</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Promotion</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {listings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="border-t border-[#303030] hover:bg-[#202020]"
                    >
                      <td className="p-4 text-gray-400">
                        {listing.id}
                      </td>

                      <td className="max-w-[260px] p-4 font-bold">
                        {listing.title || "Untitled listing"}
                      </td>

                      <td className="whitespace-nowrap p-4">
                        {formatPrice(listing.price)}
                      </td>

                      <td className="p-4">
                        {listing.category || "—"}
                      </td>

                      <td className="p-4">
                        {listing.location || "—"}
                      </td>

                      <td className="p-4">
                        {isPromoted(listing) ? (
                          <span className="rounded-lg bg-orange-500/15 px-2 py-1 font-bold text-orange-400">
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/listing?id=${encodeURIComponent(String(listing.id))}`}
                            className="font-bold underline underline-offset-4 hover:text-gray-300"
                          >
                            View
                          </Link>

                          <Link
                            href={`/edit-listing?id=${encodeURIComponent(String(listing.id))}`}
                            className="font-bold text-gray-300 underline underline-offset-4 hover:text-white"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/my-listings"
            className="rounded-xl bg-[#242424] px-5 py-3 font-bold hover:bg-[#333333]"
          >
            My Listings
          </Link>

          <Link
            href="/"
            className="rounded-xl bg-white px-5 py-3 font-bold text-black hover:bg-gray-200"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
