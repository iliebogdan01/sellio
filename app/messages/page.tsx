"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Message = {
  id: number;
  listing_id: number;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [listingId, setListingId] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    const supabase = createClient();

    const params = new URLSearchParams(window.location.search);
    const id = params.get("listing");

    if (!id) {
      setError("Listing ID is missing.");
      setLoading(false);
      return;
    }

    setListingId(id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, user_id")
      .eq("id", Number(id))
      .single();

    if (listingError || !listing) {
      setError("Listing not found.");
      setLoading(false);
      return;
    }

    setListingTitle(listing.title);
    setSellerId(listing.user_id);

    if (listing.user_id === user.id) {
      setError("You cannot message yourself.");
      setLoading(false);
      return;
    }

    const { data, error: messagesError } = await supabase
      .from("messages")
      .select(
        "id, listing_id, sender_id, receiver_id, text, created_at"
      )
      .eq("listing_id", Number(id))
      .order("created_at", { ascending: true });

    if (messagesError) {
      setError(messagesError.message);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  }

  async function sendMessage(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    if (!userId || !sellerId || !listingId) {
      return;
    }

    const supabase = createClient();

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        listing_id: Number(listingId),
        sender_id: userId,
        receiver_id: sellerId,
        text: text.trim(),
      })
      .select(
        "id, listing_id, sender_id, receiver_id, text, created_at"
      )
      .single();

    if (sendError) {
      setError(sendError.message);
      return;
    }

    if (data) {
      setMessages([...messages, data]);
    }

    setText("");
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">

          <a href="/" className="text-3xl font-bold">
            Sellio
          </a>

          <div className="flex gap-4">
            <a href="/" className="px-3 py-2">
              Home
            </a>

            <a href="/my-listings" className="px-3 py-2">
              My Listings
            </a>

            <a href="/profile" className="px-3 py-2">
              Profile
            </a>
          </div>

        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        <h1 className="text-4xl font-bold mb-2">
          Messages
        </h1>

        <p className="text-gray-500 mb-8">
          Contact the seller about this listing.
        </p>

        {listingTitle && (
          <div className="bg-white border rounded-lg p-5 mb-6">
            <p className="text-sm text-gray-500">
              Listing
            </p>

            <h2 className="text-xl font-bold">
              {listingTitle}
            </h2>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white border rounded-lg overflow-hidden">

          <div className="border-b p-5">
            <h2 className="font-bold">
              Conversation
            </h2>
          </div>

          <div className="p-5 min-h-[400px]">

            {loading && (
              <p className="text-center text-gray-500">
                Loading...
              </p>
            )}

            {!loading && messages.length === 0 && (
              <p className="text-center text-gray-500">
                No messages yet.
              </p>
            )}

            {!loading && messages.length > 0 && (
              <div className="space-y-4">

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.sender_id === userId
                        ? "text-right"
                        : "text-left"
                    }
                  >

                    <div className="inline-block bg-gray-100 rounded-lg px-4 py-3 max-w-[70%]">
                      {message.text}
                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

          <form
            onSubmit={sendMessage}
            className="border-t p-4 flex gap-3"
          >

            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write a message..."
              className="flex-1 border rounded-lg px-4 py-3"
            />

            <button
              type="submit"
              className="bg-black text-white rounded-lg px-6 py-3"
            >
              Send
            </button>

          </form>

        </div>

      </main>

    </div>
  );
}