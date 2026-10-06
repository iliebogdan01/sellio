"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MessageBadge from "../../components/MessageBadge";

type Message = {
  id: number;
  listing_id: number;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
};

type Listing = {
  id: number;
  title: string;
  image: string | null;
};

type Conversation = {
  key: string;
  listing_id: number;
  other_user_id: string;
  listing_title: string;
  listing_image: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

export default function MessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMessages();

    const supabase = createClient();

    const channel = supabase
      .channel("sellio-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async () => {
          await loadMessages();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMessages() {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to view your messages.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: messageData, error: messageError } =
        await supabase
          .from("messages")
          .select(
            `
              id,
              listing_id,
              sender_id,
              receiver_id,
              text,
              created_at,
              is_read
            `
          )
          .or(
            `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
          )
          .order("created_at", {
            ascending: true,
          });

      if (messageError) {
        console.error(messageError);
        setError(messageError.message);
        setLoading(false);
        return;
      }

      const loadedMessages = (messageData || []) as Message[];

      setMessages(loadedMessages);

      const listingIds = Array.from(
        new Set(
          loadedMessages.map(
            (message) => message.listing_id
          )
        )
      );

      if (listingIds.length > 0) {
        const { data: listingData, error: listingError } =
          await supabase
            .from("listings")
            .select("id, title, image")
            .in("id", listingIds);

        if (!listingError) {
          setListings((listingData || []) as Listing[]);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

      setLoading(false);
    }
  }

  function getConversationKey(
    listingId: number,
    otherUserId: string
  ) {
    return `${listingId}-${otherUserId}`;
  }

  const conversations = useMemo(() => {
    if (!userId) return [];

    const map = new Map<string, Conversation>();

    for (const message of messages) {
      const otherUserId =
        message.sender_id === userId
          ? message.receiver_id
          : message.sender_id;

      const key = getConversationKey(
        message.listing_id,
        otherUserId
      );

      const listing = listings.find(
        (item) => item.id === message.listing_id
      );

      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          key,
          listing_id: message.listing_id,
          other_user_id: otherUserId,
          listing_title:
            listing?.title || "Listing",
          listing_image:
            listing?.image || null,
          last_message: message.text,
          last_message_at: message.created_at,
          unread_count:
            message.receiver_id === userId &&
            !message.is_read
              ? 1
              : 0,
        });
      } else {
        if (
          new Date(message.created_at).getTime() >
          new Date(existing.last_message_at).getTime()
        ) {
          existing.last_message = message.text;
          existing.last_message_at =
            message.created_at;
        }

        if (
          message.receiver_id === userId &&
          !message.is_read
        ) {
          existing.unread_count += 1;
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime()
    );
  }, [messages, listings, userId]);

  const selectedConversation = conversations.find(
    (conversation) =>
      conversation.key === selectedKey
  );

  const selectedMessages = useMemo(() => {
    if (!selectedConversation || !userId) {
      return [];
    }

    return messages.filter((message) => {
      const otherUserId =
        message.sender_id === userId
          ? message.receiver_id
          : message.sender_id;

      return (
        message.listing_id ===
          selectedConversation.listing_id &&
        otherUserId ===
          selectedConversation.other_user_id
      );
    });
  }, [
    messages,
    selectedConversation,
    userId,
  ]);

  useEffect(() => {
    if (
      !selectedKey &&
      conversations.length > 0
    ) {
      setSelectedKey(conversations[0].key);
    }
  }, [conversations, selectedKey]);

  useEffect(() => {
    if (
      selectedConversation &&
      userId
    ) {
      markConversationAsRead(
        selectedConversation.listing_id,
        selectedConversation.other_user_id
      );
    }
  }, [
    selectedKey,
    selectedConversation,
    userId,
  ]);

  async function markConversationAsRead(
    listingId: number,
    otherUserId: string
  ) {
    if (!userId) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("messages")
      .update({
        is_read: true,
      })
      .eq("listing_id", listingId)
      .eq("receiver_id", userId)
      .eq("sender_id", otherUserId)
      .eq("is_read", false);

    if (error) {
      console.error(
        "Could not mark messages as read:",
        error
      );
      return;
    }

    setMessages((current) =>
      current.map((message) => {
        const belongsToConversation =
          message.listing_id === listingId &&
          message.sender_id === otherUserId &&
          message.receiver_id === userId;

        if (
          belongsToConversation &&
          !message.is_read
        ) {
          return {
            ...message,
            is_read: true,
          };
        }

        return message;
      })
    );
  }

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !userId ||
      !selectedConversation ||
      !text.trim()
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const supabase = createClient();

      const { error: sendError } =
        await supabase
          .from("messages")
          .insert({
            listing_id:
              selectedConversation.listing_id,
            sender_id: userId,
            receiver_id:
              selectedConversation.other_user_id,
            text: text.trim(),
          });

      if (sendError) {
        console.error(sendError);
        setError(sendError.message);
        return;
      }

      setText("");

      await loadMessages();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not send message."
      );
    } finally {
      setSending(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white flex flex-col">

      {/* HEADER */}

      <header className="bg-[#080808] border-b border-[#292929] sticky top-0 z-50">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          <div className="flex items-center gap-3">

            <Link
              href="/"
              className="shrink-0 text-2xl sm:text-3xl font-black tracking-tight text-white hover:opacity-80 transition"
            >
              Sellio
            </Link>

            <div className="flex-1 flex justify-center">

              <Link
                href="/"
                className="hidden sm:flex w-full max-w-xl bg-[#151515] border border-[#333333] rounded-xl px-4 py-2.5 items-center gap-3 hover:border-[#555555] transition"
              >
                <span className="text-xl">
                  🔎
                </span>

                <span className="text-sm text-[#888888]">
                  What are you looking for?
                </span>
              </Link>

            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              <Link
                href="/favourites"
                title="Favourites"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-[#202020] text-lg transition"
              >
                ❤️
              </Link>

              <MessageBadge />

              <Link
                href="/profile"
                title="Profile"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-[#202020] text-lg transition"
              >
                👤
              </Link>

              <Link
                href="/sell"
                className="bg-white hover:bg-gray-200 text-black px-3 sm:px-5 py-2.5 rounded-xl font-black text-sm transition"
              >
                + Sell
              </Link>

            </div>

          </div>

        </div>

      </header>

      {/* CATEGORY BAR */}

      <section className="bg-[#0d0d0d] border-b border-[#292929]">

        <div className="w-full px-3 sm:px-5 lg:px-7 py-3">

          <div className="flex gap-2 overflow-x-auto">

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-black"
            >
              🏠 Home
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              🚗 Cars
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              📱 Electronics
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              👕 Fashion
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              🏠 Property
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
            >
              🎮 Gaming
            </Link>

          </div>

        </div>

      </section>

      {/* MAIN */}

      <section className="flex-1 w-full px-3 sm:px-5 lg:px-7 py-8">

        <div className="w-full max-w-7xl mx-auto">

          {/* TITLE */}

          <div className="mb-8">

            <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#777777]">
              Sellio Account
            </p>

            <h1 className="text-3xl sm:text-4xl font-black mt-2">
              Messages
            </h1>

            <p className="text-[#888888] mt-2">
              Manage your conversations with Sellio buyers and sellers.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 bg-[#241414] border border-[#5a2929] text-[#ffb5b5] rounded-xl px-5 py-4">

              <p className="font-black">
                Something went wrong
              </p>

              <p className="text-sm mt-1">
                {error}
              </p>

            </div>
          )}

          {/* LOADING */}

          {loading ? (

            <div className="bg-[#181818] border border-[#303030] rounded-2xl p-16 text-center">

              <div className="w-11 h-11 border-4 border-[#333333] border-t-white rounded-full animate-spin mx-auto" />

              <p className="mt-4 text-[#888888]">
                Loading your messages...
              </p>

            </div>

          ) : conversations.length === 0 ? (

            <div className="bg-[#181818] border border-[#303030] rounded-2xl p-12 text-center">

              <div className="text-7xl">
                💬
              </div>

              <h2 className="text-2xl font-black mt-5">
                No messages yet
              </h2>

              <p className="text-[#888888] mt-2 max-w-md mx-auto">
                Your conversations with buyers and sellers will appear here.
              </p>

              <Link
                href="/"
                className="inline-flex mt-6 bg-white hover:bg-gray-200 text-black px-7 py-3 rounded-xl font-black transition"
              >
                Browse Listings
              </Link>

            </div>

          ) : (

            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">

              {/* CONVERSATIONS */}

              <div className="bg-[#181818] border border-[#303030] rounded-2xl overflow-hidden">

                <div className="px-5 py-4 border-b border-[#303030]">

                  <h2 className="font-black text-lg">
                    Conversations
                  </h2>

                  <p className="text-xs text-[#777777] mt-1">
                    {conversations.length} conversation
                    {conversations.length === 1 ? "" : "s"}
                  </p>

                </div>

                <div className="max-h-[650px] overflow-y-auto">

                  {conversations.map(
                    (conversation) => {

                      const active =
                        selectedKey ===
                        conversation.key;

                      return (
                        <button
                          key={conversation.key}
                          type="button"
                          onClick={() =>
                            setSelectedKey(
                              conversation.key
                            )
                          }
                          className={`w-full text-left p-4 border-b border-[#292929] transition ${
                            active
                              ? "bg-[#292929]"
                              : "hover:bg-[#202020]"
                          }`}
                        >

                          <div className="flex gap-3">

                            <div className="w-12 h-12 rounded-xl bg-[#222222] border border-[#333333] shrink-0 overflow-hidden flex items-center justify-center">

                              {conversation.listing_image ? (
                                <img
                                  src={
                                    conversation.listing_image
                                  }
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xl">
                                  📦
                                </span>
                              )}

                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-2">

                                <p className="font-black text-sm truncate">
                                  {
                                    conversation.listing_title
                                  }
                                </p>

                                {conversation.unread_count >
                                  0 && (
                                  <span className="shrink-0 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center">
                                    {conversation.unread_count >
                                    99
                                      ? "99+"
                                      : conversation.unread_count}
                                  </span>
                                )}

                              </div>

                              <p className="text-xs text-[#888888] mt-1">
                                {formatDate(
                                  conversation.last_message_at
                                )}
                              </p>

                              <p
                                className={`text-sm mt-2 truncate ${
                                  conversation.unread_count >
                                  0
                                    ? "text-white font-bold"
                                    : "text-[#777777]"
                                }`}
                              >
                                {
                                  conversation.last_message
                                }
                              </p>

                            </div>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              {/* CHAT */}

              <div className="bg-[#181818] border border-[#303030] rounded-2xl overflow-hidden flex flex-col min-h-[650px]">

                {selectedConversation ? (

                  <>
                    {/* CHAT HEADER */}

                    <div className="px-5 py-4 border-b border-[#303030] flex items-center justify-between gap-4">

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-11 h-11 rounded-xl bg-[#222222] border border-[#333333] shrink-0 overflow-hidden flex items-center justify-center">

                          {selectedConversation.listing_image ? (
                            <img
                              src={
                                selectedConversation.listing_image
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              📦
                            </span>
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="text-xs uppercase tracking-wide font-bold text-[#777777]">
                            Listing
                          </p>

                          <h2 className="font-black truncate">
                            {
                              selectedConversation.listing_title
                            }
                          </h2>

                        </div>

                      </div>

                      <Link
                        href={`/listing?id=${encodeURIComponent(
                          String(
                            selectedConversation.listing_id
                          )
                        )}`}
                        className="shrink-0 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-xl text-sm font-black transition"
                      >
                        View Listing
                      </Link>

                    </div>

                    {/* CHAT MESSAGES */}

                    <div className="flex-1 p-5 space-y-3 overflow-y-auto bg-[#111111]">

                      {selectedMessages.map(
                        (message) => {

                          const mine =
                            message.sender_id ===
                            userId;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                mine
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >

                              <div
                                className={`max-w-[80%] ${
                                  mine
                                    ? "bg-white text-black"
                                    : "bg-[#292929] text-white"
                                } rounded-2xl px-4 py-3`}
                              >

                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.text}
                                </p>

                                <p
                                  className={`text-[10px] mt-2 ${
                                    mine
                                      ? "text-gray-500"
                                      : "text-[#888888]"
                                  }`}
                                >
                                  {formatDate(
                                    message.created_at
                                  )}
                                </p>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* SEND MESSAGE */}

                    <form
                      onSubmit={sendMessage}
                      className="p-4 border-t border-[#303030] bg-[#181818]"
                    >

                      <div className="flex gap-2">

                        <input
                          value={text}
                          onChange={(event) =>
                            setText(
                              event.target.value
                            )
                          }
                          placeholder="Write a message..."
                          className="flex-1 bg-[#111111] border border-[#333333] focus:border-[#666666] outline-none rounded-xl px-4 py-3 text-white placeholder:text-[#666666]"
                        />

                        <button
                          type="submit"
                          disabled={
                            sending ||
                            !text.trim()
                          }
                          className="bg-white hover:bg-gray-200 disabled:bg-[#333333] disabled:text-[#777777] text-black px-5 py-3 rounded-xl font-black transition"
                        >
                          {sending
                            ? "..."
                            : "Send"}
                        </button>

                      </div>

                    </form>
                  </>

                ) : (

                  <div className="flex-1 flex items-center justify-center text-center p-10">

                    <div>

                      <div className="text-6xl">
                        💬
                      </div>

                      <h2 className="text-2xl font-black mt-5">
                        Select a conversation
                      </h2>

                      <p className="text-[#888888] mt-2">
                        Choose a conversation from the left.
                      </p>

                    </div>

                  </div>

                )}

              </div>

            </div>

          )}

        </div>

      </section>

      {/* CTA */}

      <section className="w-full px-3 sm:px-5 lg:px-7 pb-8">

        <div className="w-full max-w-7xl mx-auto bg-white text-black rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">

          <div>

            <p className="text-xl sm:text-2xl font-black">
              Want to sell something?
            </p>

            <p className="text-gray-500 text-sm mt-1">
              Create a listing and start selling on Sellio.
            </p>

          </div>

          <Link
            href="/sell"
            className="bg-black hover:bg-[#222222] text-white px-6 py-3 rounded-xl font-black transition"
          >
            + Create Listing
          </Link>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-black text-gray-400 shrink-0 border-t border-gray-800">

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
                className="text-gray-400 hover:text-white transition"
              >
                Home
              </Link>

              <Link
                href="/sell"
                className="text-gray-400 hover:text-white transition"
              >
                Sell
              </Link>

              <Link
                href="/my-listings"
                className="text-gray-400 hover:text-white transition"
              >
                My Listings
              </Link>

              <Link
                href="/favourites"
                className="text-gray-400 hover:text-white transition"
              >
                Favourites
              </Link>

              <Link
                href="/messages"
                className="text-white font-bold"
              >
                Messages
              </Link>

              <Link
                href="/profile"
                className="text-gray-400 hover:text-white transition"
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