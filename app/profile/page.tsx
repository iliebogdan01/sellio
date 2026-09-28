"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();

    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        console.log("PROFILE USER:", user);
        console.log("PROFILE ERROR:", error);

        if (!mounted) {
          return;
        }

        if (error || !user) {
          window.location.href = "/login";
          return;
        }

        const userName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Sellio User";

        const userPhone =
          user.user_metadata?.phone || "";

        const profileUser: ProfileUser = {
          id: user.id,
          name: userName,
          email: user.email || "",
          phone: userPhone,
        };

        setUser(profileUser);

        setName(profileUser.name);
        setEmail(profileUser.email);
        setPhone(profileUser.phone);
      } catch (error) {
        console.error("Profile error:", error);

        if (mounted) {
          window.location.href = "/login";
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          window.location.href = "/login";
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function saveAccount() {
    if (!user) {
      return;
    }

    if (!name.trim()) {
      setMessage("Name is required.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Phone number is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.auth.updateUser({
          data: {
            name: name.trim(),
            phone: phone.trim(),
          },
        });

      if (error) {
        console.error(
          "Update profile error:",
          error
        );

        setMessage(error.message);
        return;
      }

      const updatedName =
        data.user?.user_metadata?.name ||
        name.trim();

      const updatedPhone =
        data.user?.user_metadata?.phone ||
        phone.trim();

      setUser({
        ...user,
        name: updatedName,
        phone: updatedPhone,
      });

      setName(updatedName);
      setPhone(updatedPhone);

      setEditing(false);

      setMessage(
        "Profile updated successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      setMessage(
        "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Logout error:",
          error
        );

        setMessage("Could not sign out.");
        return;
      }

      window.location.href = "/login";
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      setMessage("Could not sign out.");
    }
  }

  function cancelEditing() {
    if (!user) {
      return;
    }

    setEditing(false);

    setName(user.name);
    setPhone(user.phone);

    setMessage("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-[#333333] border-t-white rounded-full animate-spin mx-auto" />

          <p className="text-[#999999] mt-4">
            Loading your profile...
          </p>

        </div>
      </main>
    );
  }

  if (!user) {
    return null;
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
                href="/favourites"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                Favourites
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

        <div className="max-w-5xl mx-auto">

          {/* TITLE */}

          <div className="mb-8">

            <p className="text-xs uppercase tracking-[0.25em] text-[#777777] font-bold">
              Sellio Account
            </p>

            <h1 className="text-4xl sm:text-5xl font-black mt-2">
              My Account
            </h1>

            <p className="text-[#999999] mt-2">
              Manage your profile and account details.
            </p>

          </div>

          {/* PROFILE CARD */}

          <section className="bg-[#1b1b1b] border border-[#303030] rounded-2xl overflow-hidden">

            <div className="p-6 sm:p-8">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">

                <div className="flex items-center gap-5">

                  <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-3xl font-black shrink-0">
                    {user.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">

                    <h2 className="text-2xl font-black break-words">
                      {user.name}
                    </h2>

                    <p className="text-[#999999] mt-1 break-all">
                      {user.email}
                    </p>

                    {user.phone && (
                      <p className="text-[#888888] text-sm mt-1">
                        📞 {user.phone}
                      </p>
                    )}

                    <div className="inline-flex items-center gap-2 mt-3 bg-[#13251a] border border-[#285c36] text-[#8ee5a1] px-3 py-1.5 rounded-lg text-xs font-bold">

                      <span className="w-2 h-2 rounded-full bg-green-400" />

                      Signed in

                    </div>

                  </div>

                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setMessage("");
                    }}
                    className="border border-[#444444] hover:bg-[#252525] px-5 py-3 rounded-xl font-bold transition"
                  >
                    Edit Profile
                  </button>
                )}

              </div>

            </div>

          </section>

          {/* ACCOUNT DETAILS */}

          <section className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-6 sm:p-8 mt-6">

            <h2 className="text-2xl font-black">
              Account Details
            </h2>

            <p className="text-[#888888] text-sm mt-1">
              Your Sellio account information.
            </p>

            <div className="space-y-5 mt-7">

              {/* NAME */}

              <div>

                <label className="block text-sm font-bold mb-2">
                  Full name
                </label>

                {editing ? (

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="Your full name"
                    className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                  />

                ) : (

                  <div className="bg-[#111111] border border-[#292929] rounded-xl px-4 py-3 text-[#dddddd]">
                    {user.name}
                  </div>

                )}

              </div>

              {/* EMAIL */}

              <div>

                <label className="block text-sm font-bold mb-2">
                  Email address
                </label>

                <div className="w-full bg-[#111111] border border-[#292929] rounded-xl px-4 py-3 text-[#dddddd] break-all">
                  {email}
                </div>

                {editing && (
                  <p className="text-xs text-[#666666] mt-2">
                    Your login email is managed by Supabase.
                  </p>
                )}

              </div>

              {/* PHONE */}

              <div>

                <label className="block text-sm font-bold mb-2">
                  Phone Number
                </label>

                {editing ? (

                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="e.g. 07123 456789"
                    className="w-full bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 outline-none focus:border-white disabled:opacity-50"
                  />

                ) : (

                  <div className="w-full bg-[#111111] border border-[#292929] rounded-xl px-4 py-3 text-[#dddddd]">
                    {user.phone || (
                      <span className="text-[#666666]">
                        No phone number added
                      </span>
                    )}
                  </div>

                )}

              </div>

            </div>

            {/* EDIT BUTTONS */}

            {editing && (

              <div className="flex flex-col sm:flex-row gap-3 mt-7">

                <button
                  type="button"
                  onClick={saveAccount}
                  disabled={saving}
                  className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="border border-[#444444] hover:bg-[#252525] px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
                >
                  Cancel
                </button>

              </div>

            )}

            {/* MESSAGE */}

            {message && (

              <div className="mt-5 bg-[#202020] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-[#cccccc]">
                {message}
              </div>

            )}

          </section>

          {/* QUICK ACTIONS */}

          <section className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-6 sm:p-8 mt-6">

            <h2 className="text-xl font-black">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">

              <a
                href="/my-listings"
                className="bg-[#111111] border border-[#303030] hover:border-[#555555] rounded-xl p-5 transition"
              >

                <p className="font-bold">
                  My Listings
                </p>

                <p className="text-sm text-[#777777] mt-1">
                  Manage your items
                </p>

              </a>

              <a
                href="/favourites"
                className="bg-[#111111] border border-[#303030] hover:border-[#555555] rounded-xl p-5 transition"
              >

                <p className="font-bold">
                  Favourites
                </p>

                <p className="text-sm text-[#777777] mt-1">
                  View saved listings
                </p>

              </a>

              <a
                href="/messages"
                className="bg-[#111111] border border-[#303030] hover:border-[#555555] rounded-xl p-5 transition"
              >

                <p className="font-bold">
                  Messages
                </p>

                <p className="text-sm text-[#777777] mt-1">
                  Your conversations
                </p>

              </a>

            </div>

          </section>

          {/* SIGN OUT */}

          <section className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-6 sm:p-8 mt-6">

            <h2 className="text-xl font-black">
              Account & Security
            </h2>

            <p className="text-[#888888] text-sm mt-1">
              Sign out of your Sellio account.
            </p>

            <div className="border-t border-[#303030] mt-6 pt-6">

              <button
                type="button"
                onClick={logout}
                className="bg-[#2a1515] hover:bg-[#351919] border border-[#553333] text-[#ffb3b3] px-6 py-3 rounded-xl font-bold transition"
              >
                Sign out
              </button>

            </div>

          </section>

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

            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}