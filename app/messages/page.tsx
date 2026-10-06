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
  user_id: string;
};

type Conversation = {
  key: string;
  listingId: number;
  otherUserId: string;
  listing: Listing | null;
  otherProfile: Profile | null;
  lastMessage: Message | null;
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
  const [newConversation, setNewConversation] =
    useState<Conversation | null>(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  /*
   * LOAD USER
   */
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

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

  /*
   * LOAD MESSAGES
   */
  useEffect(() => {
    if (!userId) return;

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

      if (!mounted) return;

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
          .select("id, title, price, image, user_id")
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

  /*
   * CREATE CONVERSATIONS FROM EXISTING MESSAGES
   */
  const conversations = useMemo(() => {
    if (!userId) return [];

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

    return Array.from(map.values()).sort((a, b) => {
      const aTime = a.lastMessage
        ? new Date(a.lastMessage.created_at).getTime()
        : 0;

      const bTime = b.lastMessage
        ? new Date(b.lastMessage.created_at).getTime()
        : 0;

      return bTime - aTime;
    });
  }, [messages, profiles, listings, userId]);

  /*
   * OPEN NEW CONVERSATION FROM LISTING
   */
  useEffect(() => {
    if (!userId || !listingFromUrl) return;

    let mounted = true;

    async function openListingConversation() {
      const listingId = Number(listingFromUrl);

      if (!listingId) return;

      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("id, title, price, image, user_id")
        .eq("id", listingId)
        .single();

      if (!mounted) return;

      if (listingError || !listingData) {
        console.error(listingError);
        setError("Could not load this listing.");
        return;
      }

      const listing = listingData as Listing;

      setListings((current) => ({
        ...current,
        [listing.id]: listing,
      }));

      /*
       * DO NOT ALLOW USER TO MESSAGE THEMSELVES
       */
      if (listing.user_id === userId) {
        const ownConversation = conversations.find(
          (conversation) =>
            conversation.listingId === listing.id
        );

        if (ownConversation) {
          setSelectedKey(ownConversation.key);
        }

        setNewConversation(null);
        return;
      }

      /*
       * CHECK IF CONVERSATION ALREADY EXISTS
       */
      const existingConversation = conversations.find(
        (conversation) =>
          conversation.listingId === listing.id &&
          conversation.otherUserId === listing.user_id
      );

      if (existingConversation) {
        setSelectedKey(existingConversation.key);
        setNewConversation(null);
        return;
      }

      /*
       * NEW EMPTY CONVERSATION
       */
      const newKey = `${listing.id}-${listing.user_id}`;

      const { data: sellerProfile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", listing.user_id)
        .maybeSingle();

      const conversation: Conversation = {
        key: newKey,
        listingId: listing.id,
        otherUserId: listing.user_id,
        listing,
        otherProfile: (sellerProfile as Profile) ?? null,
        lastMessage: null,
      };

      setNewConversation(conversation);
      setSelectedKey(newKey);
    }

    openListingConversation();

    return () => {
      mounted = false;
    };
  }, [listingFromUrl, userId, conversations, supabase]);

  /*
   * SELECT NORMAL CONVERSATION
   */
  useEffect(() => {
    if (!userId || listingFromUrl) return;

    if (conversations.length === 0) {
      setSelectedKey(null);
      setNewConversation(null);
      return;
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
  }, [conversations, listingFromUrl, userId]);

  /*
   * SELECTED CONVERSATION
   */
  const selectedConversation = useMemo(() => {
    if (newConversation && newConversation.key === selectedKey) {
      return newConversation;
    }

    return (
      conversations.find(
        (conversation) => conversation.key === selectedKey
      ) ?? null
    );
  }, [conversations, newConversation, selectedKey]);

  /*
   * SELECTED MESSAGES
   */
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

  /*
   * DELETE CONVERSATION
   */
  async function deleteConversation() {
    if (!userId || !selectedConversation || deleting) {
      return;
    }

    const otherName =
      selectedConversation.otherProfile?.full_name ||
      "this user";

    const confirmed = window.confirm(
      `Are you sure you want to delete your conversation with ${otherName}?`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const conversationMessages = messages.filter((message) => {
        const sameListing =
          message.listing_id === selectedConversation.listingId;

        const samePeople =
          (message.sender_id === userId &&
            message.receiver_id ===
              selectedConversation.otherUserId) ||
          (message.receiver_id === userId &&
            message.sender_id ===
              selectedConversation.otherUserId);

        return sameListing && samePeople;
      });

      const messageIds = conversationMessages.map(
        (message) => message.id
      );

      if (messageIds.length === 0) {
        setNewConversation(null);
        setSelectedKey(null);
        return;
      }

      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .in("id", messageIds);

      if (deleteError) {
        throw deleteError;
      }

      setMessages((current) =>
        current.filter(
          (message) => !messageIds.includes(message.id)
        )
      );

      setNewConversation(null);
      setSelectedKey(null);
      setText("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete conversation."
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * SCROLL TO BOTTOM
   */
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

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

  /*
   * MARK AS READ
   */
  useEffect(() => {
    if (!userId || selectedMessages.length === 0) {
      return;
    }

    const unreadIds = selectedMessages
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

  /*
   * SEND MESSAGE
   */
  async function sendMessage() {
    if (!userId || !selectedConversation) {
      return;
    }

    const cleanText = text.trim();

    if (!cleanText) return;

    /*
     * PREVENT MESSAGING YOURSELF
     */
    if (selectedConversation.otherUserId === userId) {
      setError("You cannot send a message to yourself.");
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
        const newMessage = data as Message;

        setMessages((current) => [
          ...current,
          newMessage,
        ]);

        /*
         * NEW CONVERSATION BECOMES NORMAL CONVERSATION
         */
        setNewConversation(null);

        setSelectedKey(
          `${newMessage.listing_id}-${newMessage.receiver_id}`
        );
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

  /*
   * NOT LOGGED IN
   */
  if (!userId && !loading) {
    return (
      <main className="min-h-screen bg-[#111111] text-white">
        <header className="border-b border-[#303030] bg-[#181818]">
          <div className="flex w-full items-center justify-between px-4 py-4">
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

        <section className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[#303030] bg-[#181818] p-8 text-center">
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

  /*
   * MAIN PAGE
   */
  return (
    <main className="min-h-screen bg-[#111111] text-white">
      <header className="sticky top-0 z-30 border-b border-[#303030] bg-[#181818]">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6">
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

      <section className="w-full px-4 py-5 sm:px-6 sm:py-8">
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
        ) : conversations.length === 0 &&
          !newConversation ? (
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
          <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-250px)] lg:min-h-[600px] lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* CONVERSATIONS */}
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
                      onClick={() => {
                        setNewConversation(null);
                        setSelectedKey(conversation.key);
                      }}
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

                            {conversation.lastMessage && (
                              <span className="shrink-0 text-[10px] text-[#777777]">
                                {formatConversationDate(
                                  conversation.lastMessage
                                    .created_at
                                )}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-[#777777]">
                            {conversation.listing?.title ||
                              `Listing #${conversation.listingId}`}
                          </p>

                          {conversation.lastMessage && (
                            <p className="mt-1 truncate text-xs text-[#999999]">
                              {conversation.lastMessage.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {newConversation && (
                  <button
                    type="button"
                    className="w-full border-b border-[#292929] bg-[#252525] px-4 py-4 text-left"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#303030] text-lg font-black">
                        {(
                          newConversation.otherProfile?.full_name ||
                          "S"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {newConversation.otherProfile
                            ?.full_name || "Sellio User"}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#777777]">
                          {newConversation.listing?.title}
                        </p>

                        <p className="mt-1 text-xs text-[#999999]">
                          New conversation
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </aside>

            {/* CHAT */}
            <section className="flex h-[calc(100dvh-390px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-[#303030] bg-[#181818] lg:h-auto">
              {selectedConversation ? (
                <>
                  {/* CHAT HEADER */}
                  <div className="shrink-0 border-b border-[#303030] px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      {selectedConversation.otherProfile
                        ?.avatar_url ? (
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

                      <button
                        type="button"
                        onClick={deleteConversation}
                        disabled={deleting}
                        title="Delete conversation"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-900/60 bg-red-950/30 text-lg transition hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleting ? "..." : "🗑️"}
                      </button>
                    </div>
                  </div>

                  {/* MESSAGES */}
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

                      {selectedMessages.length === 0 && (
                        <div className="flex min-h-[300px] items-center justify-center text-center text-sm text-[#777777]">
                          <div>
                            <div className="mb-3 text-4xl">
                              💬
                            </div>

                            <p>
                              Start the conversation with this
                              seller.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* INPUT */}
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