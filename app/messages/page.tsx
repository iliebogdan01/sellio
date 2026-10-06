"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Message = {
  id: number;
  listing_id: number;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
};

type Listing = {
  id: number;
  title: string;
  image?: string | null;
};

type Conversation = {
  listing_id: number;
  other_user_id: string;
  listing_title: string;
  last_message: string;
  last_message_at: string;
};

export default function MessagesPage() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(
    null
  );

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    const supabase = createClient();

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select(
        "id, listing_id, sender_id, receiver_id, text, created_at"
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (messageError) {
      setError(messageError.message);
      setLoading(false);
      return;
    }

    const loadedMessages = messageData || [];

    setMessages(loadedMessages);

    const listingIds = [
      ...new Set(loadedMessages.map((message) => message.listing_id)),
    ];

    if (listingIds.length > 0) {
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("id, title, image")
        .in("id", listingIds);

      if (listingError) {
        setError(listingError.message);
      } else {
        setListings(listingData || []);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const listingFromUrl = params.get("listing");

    if (listingFromUrl) {
      const listingId = Number(listingFromUrl);

      if (!Number.isNaN(listingId)) {
        setSelectedListingId(listingId);
      }
    } else if (loadedMessages.length > 0) {
      setSelectedListingId(loadedMessages[loadedMessages.length - 1].listing_id);
    }

    setLoading(false);
  }

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();

    for (const message of messages) {
      const otherUserId =
        message.sender_id === userId
          ? message.receiver_id
          : message.sender_id;

      const listing = listings.find(
        (item) => item.id === message.listing_id
      );

      const key = `${message.listing_id}-${otherUserId}`;

      map.set(key, {
        listing_id: message.listing_id,
        other_user_id: otherUserId,
        listing_title:
          listing?.title || `Listing #${message.listing_id}`,
        last_message: message.text,
        last_message_at: message.created_at,
      });
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime()
    );
  }, [messages, listings, userId]);

  const selectedMessages = useMemo(() => {
    if (!selectedListingId) {
      return [];
    }

    return messages.filter(
      (message) => message.listing_id === selectedListingId
    );
  }, [messages, selectedListingId]);

  const selectedConversation = useMemo(() => {
    if (!selectedListingId) {
      return null;
    }

    return conversations.find(
      (conversation) => conversation.listing_id === selectedListingId
    );
  }, [conversations, selectedListingId]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText || sending || !userId || !selectedListingId) {
      return;
    }

    const conversation = selectedConversation;

    if (!conversation) {
      setError("Conversation not found.");
      return;
    }

    setSending(true);
    setError("");

    const supabase = createClient();

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        listing_id: selectedListingId,
        sender_id: userId,
        receiver_id: conversation.other_user_id,
        text: cleanText,
      })
      .select(
        "id, listing_id, sender_id, receiver_id, text, created_at"
      )
      .single();

    if (sendError) {
      setError(sendError.message);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((current) => [...current, data]);
    }

    setText("");
    setSending(false);
  }

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;

          if (
            newMessage.sender_id === userId ||
            newMessage.receiver_id === userId
          ) {
            setMessages((current) => {
              const alreadyExists = current.some(
                (message) => message.id === newMessage.id
              );

              if (alreadyExists) {
                return current;
              }

              return [...current, newMessage];
            });

            if (
              newMessage.receiver_id === userId &&
              !selectedListingId
            ) {
              setSelectedListingId(newMessage.listing_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedListingId]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <a href="/" className="text-3xl font-black">
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

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-black mb-2">Messages</h1>

        <p className="text-gray-500 mb-8">
          Your conversations
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white border rounded-xl overflow-hidden min-h-[600px] grid grid-cols-1 md:grid-cols-[320px_1fr]">
          <aside className="border-r">
            <div className="p-5 border-b">
              <h2 className="font-black text-xl">
                Conversations
              </h2>
            </div>

            <div>
              {loading && (
                <p className="p-5 text-gray-500">
                  Loading...
                </p>
              )}

              {!loading && conversations.length === 0 && (
                <p className="p-5 text-gray-500">
                  No conversations yet.
                </p>
              )}

              {!loading &&
                conversations.map((conversation) => (
                  <button
                    key={`${conversation.listing_id}-${conversation.other_user_id}`}
                    onClick={() =>
                      setSelectedListingId(conversation.listing_id)
                    }
                    className={`w-full text-left p-5 border-b hover:bg-gray-50 ${
                      selectedListingId === conversation.listing_id
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    <p className="font-bold truncate">
                      {conversation.listing_title}
                    </p>

                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conversation.last_message}
                    </p>
                  </button>
                ))}
            </div>
          </aside>

          <section className="flex flex-col">
            {!selectedListingId && (
              <div className="flex-1 flex items-center justify-center text-gray-500 p-10">
                Select a conversation.
              </div>
            )}

            {selectedListingId && (
              <>
                <div className="border-b p-5">
                  <h2 className="font-black text-xl">
                    {selectedConversation?.listing_title ||
                      `Listing #${selectedListingId}`}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Conversation
                  </p>
                </div>

                <div className="flex-1 p-6 min-h-[400px] overflow-y-auto">
                  {selectedMessages.length === 0 && (
                    <p className="text-center text-gray-500 mt-10">
                      No messages yet.
                    </p>
                  )}

                  <div className="space-y-4">
                    {selectedMessages.map((message) => {
                      const mine = message.sender_id === userId;

                      return (
                        <div
                          key={message.id}
                          className={
                            mine ? "text-right" : "text-left"
                          }
                        >
                          <div
                            className={`inline-block rounded-xl px-4 py-3 max-w-[75%] ${
                              mine
                                ? "bg-black text-white"
                                : "bg-gray-100 text-black"
                            }`}
                          >
                            <p>{message.text}</p>

                            <p
                              className={`text-xs mt-1 ${
                                mine
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              {new Date(
                                message.created_at
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedConversation && (
                  <form
                    onSubmit={sendMessage}
                    className="border-t p-4 flex gap-3"
                  >
                    <input
                      type="text"
                      value={text}
                      onChange={(event) =>
                        setText(event.target.value)
                      }
                      placeholder="Write a message..."
                      className="flex-1 border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                    />

                    <button
                      type="submit"
                      disabled={sending}
                      className="bg-black text-white rounded-lg px-6 py-3 font-bold disabled:opacity-50"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}