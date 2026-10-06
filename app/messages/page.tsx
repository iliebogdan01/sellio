"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Message = {
  id: number;
  listing_id: number;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Listing = {
  id: number;
  title: string;
  price: number | string | null;
  image: string | null;
};

type Conversation = {
  key: string;
  listingId: number;
  otherUserId: string;
  listing: Listing | null;
  otherProfile: Profile | null;
  lastMessage: Message;
};

function MessagesContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();

  const listingFromUrl = searchParams.get("listing");

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [listings, setListings] = useState<Record<number, Listing>>({});

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let mounted = true;

    async function loadMessages() {
      setError("");

      const { data, error: messagesError } = await supabase
        .from("messages")
        .select(
          "id, listing_id, sender_id, receiver_id, text, created_at, is_read"
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", {
          ascending: true,
        });

      if (!mounted) {
        return;
      }

      if (messagesError) {
        console.error(messagesError);
        setError(messagesError.message);
        setLoading(false);
        return;
      }

      const loadedMessages = (data ?? []) as Message[];

      setMessages(loadedMessages);

      const userIds = Array.from(
        new Set(
          loadedMessages.flatMap((message) => [
            message.sender_id,
            message.receiver_id,
          ])
        )
      );

      const listingIds = Array.from(
        new Set(
          loadedMessages
            .map((message) => message.listing_id)
            .filter((id): id is number => Boolean(id))
        )
      );

      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (profileData) {
          const profileMap: Record<string, Profile> = {};

          for (const profile of profileData as Profile[]) {
            profileMap[profile.id] = profile;
          }

          setProfiles(profileMap);
        }
      }

      if (listingIds.length > 0) {
        const { data: listingData } = await supabase
          .from("listings")
          .select("id, title, price, image")
          .in("id", listingIds);

        if (listingData) {
          const listingMap: Record<number, Listing> = {};

          for (const listing of listingData as Listing[]) {
            listingMap[listing.id] = listing;
          }

          setListings(listingMap);
        }
      }

      setLoading(false);
    }

    loadMessages();

    const interval = window.setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [supabase, userId]);

  const conversations = useMemo(() => {
    if (!userId) {
      return [];
    }

    const map = new Map<string, Conversation>();

    for (const message of messages) {
      const otherUserId =
        message.sender_id === userId
          ? message.receiver_id
          : message.sender_id;

      const key = `${message.listing_id}-${otherUserId}`;

      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          key,
          listingId: message.listing_id,
          otherUserId,
          listing: listings[message.listing_id] ?? null,
          otherProfile: profiles[otherUserId] ?? null,
          lastMessage: message,
        });
      } else {
        existing.lastMessage = message;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
    );
  }, [messages, profiles, listings, userId]);

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedKey(null);
      return;
    }

    if (listingFromUrl) {
      const match = conversations.find(
        (conversation) =>
          String(conversation.listingId) === listingFromUrl
      );

      if (match) {
        setSelectedKey(match.key);
        return;
      }
    }

    setSelectedKey((current) => {
      if (
        current &&
        conversations.some(
          (conversation) => conversation.key === current
        )
      ) {
        return current;
      }

      return conversations[0].key;
    });
  }, [conversations, listingFromUrl]);

  const selectedConversation = useMemo(() => {
    return (
      conversations.find(
        (conversation) => conversation.key === selectedKey
      ) ?? null
    );
  }, [conversations, selectedKey]);

  const selectedMessages = useMemo(() => {
    if (!selectedConversation || !userId) {
      return [];
    }

    return messages.filter((message) => {
      const sameListing =
        message.listing_id === selectedConversation.listingId;

      const samePeople =
        (message.sender_id === userId &&
          message.receiver_id === selectedConversation.otherUserId) ||
        (message.receiver_id === userId &&
          message.sender_id === selectedConversation.otherUserId);

      return sameListing && samePeople;
    });
  }, [messages, selectedConversation, userId]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const timer = window.setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [selectedMessages.length, selectedKey]);

  useEffect(() => {
    if (!userId || selectedMessages.length === 0) {
      return;
    }

    const unreadIds = selectedMessages
      .filter(
        (message) =>
          message.receiver_id === userId && !message.is_read
      )
      .map((message) => message.id);

    if (unreadIds.length === 0) {
      return;
    }

    async function markAsRead() {
      const { error: updateError } = await supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", unreadIds)
        .eq("receiver_id", userId);

      if (updateError) {
        console.error(updateError);
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
  }, [selectedMessages, supabase, userId]);

  async function sendMessage() {
    if (!userId || !selectedConversation) {
      return;
    }

    const cleanText = text.trim();

    if (!cleanText) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          listing_id: selectedConversation.listingId,
          sender_id: userId,
          receiver_id: selectedConversation.otherUserId,
          text: cleanText,
          is_read: false,
        })
        .select(
          "id, listing_id, sender_id, receiver_id, text, created_at, is_read"
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setMessages((current) => [...current, data as Message]);
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
    return new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatConversationDate(date: string) {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  if (!userId && !loading) {
    return (
      <main className="min-h-screen bg-[#111111] text-white">
        <header className="border-b border-[#303030] bg-[#181818]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="text-2xl font-black tracking-tight"
            >
              Sellio
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-gray-200"
            >
              Home
            </Link>
          </div>
        </header>

        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
          <div className="w-full rounded-2xl border border-[#303030] bg-[#181818] p-8 text-center">
            <div className="mb-4 text-5xl">💬</div>

            <h1 className="text-2xl font-black">
              Sign in to view your messages
            </h1>

            <p className="mt-2 text-sm text-[#999999]">
              Log in to contact sellers and manage your conversations.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-gray-200"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white">
      <header className="sticky top-0 z-30 border-b border-[#303030] bg-[#181818]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight transition hover:opacity-80"
          >
            Sellio
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl px-3 py-2 text-sm font-bold text-[#cccccc] transition hover:bg-[#252525] hover:text-white"
            >
              Home
            </Link>

            <Link
              href="/sell"
              className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-gray-200"
            >
              Sell
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:py-8">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-wider text-[#777777]">
            Sellio
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Messages
          </h1>

          <p className="mt-2 text-sm text-[#999999]">
            Chat with buyers and sellers about listings.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#303030] bg-[#181818] p-8 text-center text-[#999999]">
            Loading messages...
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-[#303030] bg-[#181818] p-10 text-center">
            <div className="text-5xl">💬</div>

            <h2 className="mt-4 text-2xl font-black">
              No conversations yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#888888]">
              When you contact a seller or someone contacts you,
              your conversations will appear here.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-gray-200"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:h-[calc(100vh-250px)] lg:min-h-[600px]">
            <aside className="flex h-[260px] flex-col overflow-hidden rounded-2xl border border-[#303030] bg-[#181818] lg:h-auto lg:min-h-0">
              <div className="shrink-0 border-b border-[#303030] px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black">
                    Conversations
                  </h2>

                  <span className="text-xs text-[#777777]">
                    {conversations.length}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                {conversations.map((conversation) => {
                  const active =
                    conversation.key === selectedKey;

                  const otherName =
                    conversation.otherProfile?.full_name ||
                    "Sellio User";

                  return (
                    <button
                      key={conversation.key}
                      type="button"
                      onClick={() =>
                        setSelectedKey(conversation.key)
                      }
                      className={`w-full border-b border-[#292929] px-4 py-4 text-left transition ${
                        active
                          ? "bg-[#252525]"
                          : "hover:bg-[#202020]"
                      }`}
                    >
                      <div className="flex gap-3">
                        {conversation.otherProfile?.avatar_url ? (
                          <img
                            src={
                              conversation.otherProfile.avatar_url
                            }
                            alt={otherName}
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#303030] text-lg font-black">
                            {otherName
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold">
                              {otherName}
                            </p>

                            <span className="shrink-0 text-[10px] text-[#777777]">
                              {formatConversationDate(
                                conversation.lastMessage.created_at
                              )}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-[#777777]">
                            {conversation.listing?.title ||
                              `Listing #${conversation.listingId}`}
                          </p>

                          <p className="mt-1 truncate text-xs text-[#999999]">
                            {conversation.lastMessage.text}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#303030] bg-[#181818] h-[calc(100dvh-390px)] lg:h-auto">
              {selectedConversation ? (
                <>
                  <div className="shrink-0 border-b border-[#303030] px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      {selectedConversation.otherProfile?.avatar_url ? (
                        <img
                          src={
                            selectedConversation.otherProfile
                              .avatar_url
                          }
                          alt={
                            selectedConversation.otherProfile
                              .full_name || "Sellio User"
                          }
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#303030] font-black">
                          {(
                            selectedConversation.otherProfile
                              ?.full_name || "S"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">
                          {selectedConversation.otherProfile
                            ?.full_name || "Sellio User"}
                        </p>

                        <Link
                          href={`/listing?id=${selectedConversation.listingId}`}
                          className="mt-1 block truncate text-xs text-[#999999] transition hover:text-white"
                        >
                          {selectedConversation.listing?.title ||
                            `Listing #${selectedConversation.listingId}`}
                        </Link>
                      </div>

                      <Link
                        href={`/listing?id=${selectedConversation.listingId}`}
                        className="hidden rounded-lg border border-[#404040] px-3 py-2 text-xs font-bold transition hover:bg-[#252525] sm:block"
                      >
                        View listing
                      </Link>
                    </div>
                  </div>

                  <div
                    ref={messagesContainerRef}
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-width:thin] touch-pan-y sm:px-6"
                  >
                    <div className="mx-auto flex max-w-3xl flex-col gap-3">
                      {selectedMessages.map((message) => {
                        const mine =
                          message.sender_id === userId;

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
                              className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                                mine
                                  ? "rounded-br-md bg-white text-black"
                                  : "rounded-bl-md bg-[#292929] text-white"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {message.text}
                              </p>

                              <div
                                className={`mt-1 text-[10px] ${
                                  mine
                                    ? "text-[#666666]"
                                    : "text-[#888888]"
                                }`}
                              >
                                {formatMessageTime(
                                  message.created_at
                                )}

                                {mine &&
                                  message.is_read && (
                                    <span className="ml-2">
                                      Read
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-[#303030] bg-[#181818] p-3 sm:p-4">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        sendMessage();
                      }}
                      className="mx-auto flex max-w-3xl items-end gap-2"
                    >
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
                            sendMessage();
                          }
                        }}
                        placeholder="Write a message..."
                        rows={1}
                        className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-[#404040] bg-[#222222] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#666666] focus:border-white"
                      />

                      <button
                        type="submit"
                        disabled={
                          sending || !text.trim()
                        }
                        className="min-h-[46px] rounded-xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {sending ? "..." : "Send"}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-[#777777]">
                  Select a conversation.
                </div>
              )}
            </section>
          </div>
        )}
      </section>

      <style jsx global>{`
        * {
          scrollbar-width: thin;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #444444;
          border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #666666;
        }
      `}</style>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#111111] text-white">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-sm text-[#999999]">
              Loading messages...
            </div>
          </div>
        </main>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}