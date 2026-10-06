"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MessageBadge from "@/components/MessageBadge";

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
  price: number | string;
};

type Conversation = {
  key: string;
  listingId: number;
  otherUserId: string;
  listing: Listing | null;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
};

const categoryLinks = [
  { name: "Home", icon: "🏠", href: "/" },
  { name: "Cars", icon: "🚗", href: "/" },
  { name: "Electronics", icon: "📱", href: "/" },
  { name: "Fashion", icon: "👕", href: "/" },
  { name: "Property", icon: "🏠", href: "/" },
  { name: "Gaming", icon: "🎮", href: "/" },
];

export default function MessagesPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages(currentUserId?: string) {
    try {
      const id = currentUserId || userId;

      if (!id) return;

      const { data, error: messagesError } = await supabase
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
        .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
        .order("created_at", {
          ascending: true,
        });

      if (messagesError) {
        console.error(messagesError);
        setError(messagesError.message);
        return;
      }

      setMessages((data || []) as Message[]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load messages."
      );
    }
  }

  async function loadListings() {
    try {
      const { data, error: listingsError } = await supabase
        .from("listings")
        .select("id, title, image, price");

      if (listingsError) {
        console.error(listingsError);
        return;
      }

      setListings((data || []) as Listing[]);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("You must be logged in to view your messages.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      await Promise.all([
        loadMessages(user.id),
        loadListings(),
      ]);

      if (mounted) {
        setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-page-${userId}`)
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
              const exists = current.some(
                (message) => message.id === newMessage.id
              );

              if (exists) {
                return current;
              }

              return [...current, newMessage].sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime()
              );
            });
          }
        }
      )
      .subscribe();

    const interval = window.setInterval(() => {
      loadMessages(userId);
    }, 5000);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const conversations = useMemo<Conversation[]>(() => {
    if (!userId) return [];

    const grouped = new Map<string, Message[]>();

    for (const message of messages) {
      const otherUserId =
        message.sender_id === userId
          ? message.receiver_id
          : message.sender_id;

      const key = `${message.listing_id}-${otherUserId}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(message);
    }

    const result: Conversation[] = [];

    for (const [key, conversationMessages] of grouped.entries()) {
      const firstMessage = conversationMessages[0];

      if (!firstMessage) continue;

      const otherUserId =
        firstMessage.sender_id === userId
          ? firstMessage.receiver_id
          : firstMessage.sender_id;

      const lastMessage =
        conversationMessages[conversationMessages.length - 1];

      const unreadCount = conversationMessages.filter(
        (message) =>
          message.receiver_id === userId &&
          !message.is_read
      ).length;

      const listing =
        listings.find(
          (item) => item.id === firstMessage.listing_id
        ) || null;

      result.push({
        key,
        listingId: firstMessage.listing_id,
        otherUserId,
        listing,
        messages: conversationMessages,
        lastMessage,
        unreadCount,
      });
    }

    result.sort(
      (a, b) =>
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
    );

    return result;
  }, [messages, listings, userId]);

  useEffect(() => {
    if (!selectedKey && conversations.length > 0) {
      setSelectedKey(conversations[0].key);
    }

    if (
      selectedKey &&
      conversations.length > 0 &&
      !conversations.some(
        (conversation) => conversation.key === selectedKey
      )
    ) {
      setSelectedKey(conversations[0].key);
    }
  }, [conversations, selectedKey]);

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.key === selectedKey
    ) || null;

  /*
   * AUTO SCROLL
   */
  useEffect(() => {
    if (!selectedConversation) return;

    const timeout = window.setTimeout(() => {
      const container = messagesContainerRef.current;

      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    selectedKey,
    selectedConversation?.messages.length,
  ]);

  /*
   * MARK AS READ
   */
  useEffect(() => {
    if (!userId || !selectedConversation) return;

    const unreadIds = selectedConversation.messages
      .filter(
        (message) =>
          message.receiver_id === userId &&
          !message.is_read
      )
      .map((message) => message.id);

    if (unreadIds.length === 0) return;

    async function markAsRead() {
      const { error: updateError } = await supabase
        .from("messages")
        .update({
          is_read: true,
        })
        .in("id", unreadIds)
        .eq("receiver_id", userId);

      if (updateError) {
        console.error(
          "Could not mark messages as read:",
          updateError
        );
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          unreadIds.includes(message.id)
            ? {
                ...message,
                is_read: true,
              }
            : message
        )
      );
    }

    markAsRead();
  }, [selectedKey, selectedConversation, userId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText || !userId || !selectedConversation) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const receiverId =
        selectedConversation.otherUserId;

      const listingId =
        selectedConversation.listingId;

      const { data, error: insertError } =
        await supabase
          .from("messages")
          .insert({
            listing_id: listingId,
            sender_id: userId,
            receiver_id: receiverId,
            text: cleanText,
            is_read: false,
          })
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
          .single();

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        return;
      }

      if (data) {
        setMessages((current) => {
          const exists = current.some(
            (message) => message.id === data.id
          );

          if (exists) {
            return current;
          }

          return [...current, data as Message];
        });
      }

      setText("");
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

  function formatMessageTime(date: string) {
    return new Date(date).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function formatConversationDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
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
                <span className="text-xl">🔎</span>

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

            {categoryLinks.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className={
                  category.name === "Home"
                    ? "whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-black"
                    : "whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#dddddd] text-sm font-semibold transition"
                }
              >
                {category.icon} {category.name}
              </Link>
            ))}

          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="flex-1 w-full px-3 sm:px-5 lg:px-7 py-4 sm:py-6">

        <div className="w-full max-w-7xl mx-auto">

          {/* TITLE */}
          <div className="mb-4 sm:mb-5">

            <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#777777]">
              Sellio Account
            </p>

            <h1 className="text-3xl sm:text-4xl font-black mt-2">
              Messages
            </h1>

            <p className="text-[#888888] mt-2">
              Chat with buyers and sellers about your listings.
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 bg-[#241414] border border-[#5a2929] text-[#ffb5b5] rounded-xl px-5 py-4">
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
                Loading messages...
              </p>

            </div>

          ) : (

            /*
             * IMPORTANT:
             * Pe mobil chatul are o înălțime limitată
             * bazată pe viewport.
             *
             * 100dvh = înălțimea reală disponibilă pe telefon.
             */
            <div
              className="
                grid
                grid-cols-1
                lg:grid-cols-[320px_minmax(0,1fr)]
                gap-4
                lg:h-[calc(100vh-250px)]
                lg:min-h-[600px]
              "
            >

              {/* CONVERSATIONS */}
              <aside
                className="
                  bg-[#181818]
                  border border-[#303030]
                  rounded-2xl
                  overflow-hidden
                  flex
                  flex-col
                  h-[260px]
                  lg:h-auto
                  lg:min-h-0
                "
              >

                <div className="px-5 py-4 border-b border-[#303030] shrink-0">

                  <div className="flex items-center justify-between">

                    <h2 className="font-black text-lg">
                      Conversations
                    </h2>

                    <span className="text-xs text-[#777777]">
                      {conversations.length}
                    </span>

                  </div>

                </div>

                <div
                  className="
                    flex-1
                    min-h-0
                    overflow-y-auto
                    overscroll-contain
                    [scrollbar-width:thin]
                  "
                >

                  {conversations.length === 0 ? (

                    <div className="p-6 text-center">

                      <div className="text-5xl">
                        💬
                      </div>

                      <p className="font-black mt-4">
                        No conversations
                      </p>

                      <p className="text-sm text-[#777777] mt-2">
                        Your conversations will appear here.
                      </p>

                    </div>

                  ) : (

                    <div className="p-2">

                      {conversations.map((conversation) => {

                        const active =
                          conversation.key === selectedKey;

                        const listingTitle =
                          conversation.listing?.title ||
                          "Listing";

                        return (
                          <button
                            key={conversation.key}
                            type="button"
                            onClick={() =>
                              setSelectedKey(
                                conversation.key
                              )
                            }
                            className={`w-full text-left rounded-xl p-3 mb-1 transition ${
                              active
                                ? "bg-white text-black"
                                : "hover:bg-[#222222] text-white"
                            }`}
                          >

                            <div className="flex items-start gap-3">

                              {conversation.listing?.image ? (

                                <img
                                  src={
                                    conversation.listing.image
                                  }
                                  alt=""
                                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                                />

                              ) : (

                                <div
                                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                                    active
                                      ? "bg-black/10"
                                      : "bg-[#292929]"
                                  }`}
                                >
                                  📦
                                </div>

                              )}

                              <div className="min-w-0 flex-1">

                                <div className="flex items-center justify-between gap-2">

                                  <p className="font-black truncate">
                                    {listingTitle}
                                  </p>

                                  {conversation.unreadCount >
                                    0 && (
                                    <span
                                      className={`min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                        active
                                          ? "bg-black text-white"
                                          : "bg-red-600 text-white"
                                      }`}
                                    >
                                      {conversation.unreadCount >
                                      99
                                        ? "99+"
                                        : conversation.unreadCount}
                                    </span>
                                  )}

                                </div>

                                <p
                                  className={`text-xs mt-1 truncate ${
                                    active
                                      ? "text-gray-600"
                                      : "text-[#777777]"
                                  }`}
                                >
                                  {conversation.lastMessage.text}
                                </p>

                                <p
                                  className={`text-[10px] mt-1 ${
                                    active
                                      ? "text-gray-500"
                                      : "text-[#555555]"
                                  }`}
                                >
                                  {formatConversationDate(
                                    conversation.lastMessage
                                      .created_at
                                  )}
                                </p>

                              </div>

                            </div>

                          </button>
                        );
                      })}

                    </div>

                  )}

                </div>

              </aside>

              {/* CHAT */}
              <section
                className="
                  bg-[#181818]
                  border border-[#303030]
                  rounded-2xl
                  overflow-hidden
                  flex
                  flex-col
                  min-h-0
                  h-[calc(100dvh-390px)]
                  min-h-[420px]
                  lg:h-auto
                  lg:min-h-0
                "
              >

                {!selectedConversation ? (

                  <div className="flex-1 flex items-center justify-center text-center p-8">

                    <div>

                      <div className="text-6xl">
                        💬
                      </div>

                      <h2 className="text-2xl font-black mt-5">
                        Select a conversation
                      </h2>

                      <p className="text-[#777777] mt-2">
                        Choose a conversation from the left.
                      </p>

                    </div>

                  </div>

                ) : (

                  <>

                    {/* CHAT HEADER */}
                    <div className="px-4 sm:px-6 py-4 border-b border-[#303030] shrink-0">

                      <div className="flex items-center justify-between gap-4">

                        <div className="min-w-0">

                          <p className="text-xs uppercase tracking-[0.18em] text-[#777777] font-bold">
                            Conversation
                          </p>

                          <h2 className="font-black text-lg truncate mt-1">
                            {selectedConversation.listing
                              ?.title || "Listing"}
                          </h2>

                        </div>

                        <Link
                          href={`/listing?id=${encodeURIComponent(
                            String(
                              selectedConversation.listingId
                            )
                          )}`}
                          className="shrink-0 bg-white hover:bg-gray-200 text-black px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition"
                        >
                          View Listing
                        </Link>

                      </div>

                    </div>

                    {/* MESSAGES */}
                    <div
                      ref={messagesContainerRef}
                      className="
                        flex-1
                        min-h-0
                        overflow-y-auto
                        overscroll-contain
                        touch-pan-y
                        px-4
                        sm:px-6
                        py-5
                        [scrollbar-width:thin]
                      "
                    >

                      <div className="space-y-3">

                        {selectedConversation.messages.map(
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
                                  className={`max-w-[85%] sm:max-w-[70%] ${
                                    mine
                                      ? "items-end"
                                      : "items-start"
                                  } flex flex-col`}
                                >

                                  <div
                                    className={`px-4 py-3 rounded-2xl break-words whitespace-pre-wrap ${
                                      mine
                                        ? "bg-white text-black rounded-br-md"
                                        : "bg-[#292929] text-white rounded-bl-md"
                                    }`}
                                  >
                                    {message.text}
                                  </div>

                                  <div
                                    className={`text-[10px] text-[#666666] mt-1 px-1 ${
                                      mine
                                        ? "text-right"
                                        : "text-left"
                                    }`}
                                  >
                                    {formatMessageTime(
                                      message.created_at
                                    )}
                                  </div>

                                </div>

                              </div>
                            );
                          }
                        )}

                        <div
                          ref={messagesEndRef}
                          className="h-px"
                        />

                      </div>

                    </div>

                    {/* INPUT */}
                    <form
                      onSubmit={sendMessage}
                      className="
                        border-t
                        border-[#303030]
                        p-3
                        sm:p-4
                        shrink-0
                        bg-[#151515]
                      "
                    >

                      <div className="flex items-end gap-2">

                        <textarea
                          value={text}
                          onChange={(event) =>
                            setText(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              !event.shiftKey
                            ) {
                              event.preventDefault();

                              if (!sending) {
                                event.currentTarget.form?.requestSubmit();
                              }
                            }
                          }}
                          rows={1}
                          placeholder="Write a message..."
                          className="
                            flex-1
                            resize-none
                            bg-[#202020]
                            border
                            border-[#3a3a3a]
                            focus:border-[#666666]
                            outline-none
                            text-white
                            placeholder:text-[#666666]
                            rounded-xl
                            px-4
                            py-3
                            text-sm
                            min-h-[46px]
                            max-h-32
                            overflow-y-auto
                          "
                        />

                        <button
                          type="submit"
                          disabled={
                            sending ||
                            !text.trim()
                          }
                          className="
                            bg-white
                            hover:bg-gray-200
                            disabled:bg-[#333333]
                            disabled:text-[#777777]
                            text-black
                            disabled:cursor-not-allowed
                            px-4
                            sm:px-5
                            py-3
                            rounded-xl
                            font-black
                            text-sm
                            transition
                            shrink-0
                          "
                        >
                          {sending
                            ? "..."
                            : "Send"}
                        </button>

                      </div>

                      <p className="text-[10px] text-[#555555] mt-2 px-1">
                        Press Enter to send • Shift + Enter for a new line
                      </p>

                    </form>

                  </>

                )}

              </section>

            </div>

          )}

        </div>

      </section>

      {/* CTA */}
      <section className="w-full px-3 sm:px-5 lg:px-7 pb-8">

        <div className="w-full max-w-7xl mx-auto bg-white text-black rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">

          <div>

            <p className="text-xl sm:text-2xl font-black">
              Have something to sell?
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

      {/* MOBILE SCROLLBAR */}
      <style jsx global>{`
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 1023px) {
          .overflow-y-auto::-webkit-scrollbar {
            width: 6px;
          }

          .overflow-y-auto::-webkit-scrollbar-track {
            background: #181818;
          }

          .overflow-y-auto::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 999px;
          }

          .overflow-y-auto::-webkit-scrollbar-thumb:hover {
            background: #777;
          }
        }
      `}</style>

    </main>
  );
}