"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Message = {
  id: number;
  listing_id: number | null;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
};

export default function MessagesPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadMessages();

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

          setMessages((current) => {
            if (
              current.some(
                (item) => item.id === newMessage.id
              )
            ) {
              return current;
            }

            return [...current, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMessages() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please log in to view your messages.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error: messagesError } =
        await supabase
          .from("messages")
          .select(
            "id, listing_id, sender_id, receiver_id, text, created_at"
          )
          .or(
            `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
          )
          .order("created_at", {
            ascending: true,
          });

      if (messagesError) {
        console.error(
          "Messages error:",
          messagesError
        );

        setError(
          "Could not load your messages."
        );

        return;
      }

      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error(
        "Load messages error:",
        error
      );

      setError(
        "Something went wrong while loading messages."
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = message.trim();

    if (!text || sending || !userId) {
      return;
    }

    /*
      For now we need a receiver.
      The next step will connect this page to
      Contact Seller and automatically provide
      the correct receiver_id.
    */
    setError(
      "Open a conversation from a listing to send a message."
    );
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
                className="px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                ❤️ Favourites
              </a>

              <a
                href="/my-listings"
                className="hidden sm:block px-4 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-[#252525] font-bold transition"
              >
                My Listings
              </a>

              <a
                href="/profile"
                className="hidden sm:block px-4 py-2.5 rounded-xl text-[#bbbbbb] hover:text-white hover:bg-[#1b1b1b] font-bold transition"
              >
                Profile
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
              Sellio Inbox
            </p>

            <h1 className="text-4xl sm:text-5xl font-black mt-2">
              Messages
            </h1>

            <p className="text-[#999999] mt-2">
              Your conversations on Sellio.
            </p>

          </div>

          {/* CHAT */}

          <section className="bg-[#1b1b1b] border border-[#303030] rounded-2xl overflow-hidden">

            {/* CHAT HEADER */}

            <div className="p-6 sm:p-7 border-b border-[#303030]">

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-xl font-black">
                  💬
                </div>

                <div>

                  <p className="text-xs uppercase tracking-[0.2em] text-[#777777] font-bold">
                    Sellio Messages
                  </p>

                  <h2 className="text-xl font-black mt-1">
                    Conversations
                  </h2>

                </div>

              </div>

            </div>

            {/* MESSAGES */}

            <div className="min-h-[420px] p-5 sm:p-7 bg-[#111111]">

              {loading ? (

                <div className="min-h-[360px] flex items-center justify-center">

                  <div className="text-center">

                    <div className="w-10 h-10 border-4 border-[#333333] border-t-white rounded-full animate-spin mx-auto" />

                    <p className="text-[#777777] mt-4">
                      Loading messages...
                    </p>

                  </div>

                </div>

              ) : messages.length === 0 ? (

                <div className="flex flex-col items-center justify-center text-center min-h-[360px]">

                  <div className="w-20 h-20 bg-[#1b1b1b] border border-[#303030] rounded-2xl flex items-center justify-center text-3xl">
                    💬
                  </div>

                  <h2 className="text-xl font-black mt-5">
                    No messages yet
                  </h2>

                  <p className="text-[#777777] text-sm mt-2">
                    Open a listing and contact the seller
                    to start a conversation.
                  </p>

                </div>

              ) : (

                <div className="space-y-5">

                  {messages.map((item) => {

                    const mine =
                      item.sender_id === userId;

                    return (
                      <div
                        key={item.id}
                        className={
                          mine
                            ? "flex justify-end"
                            : "flex justify-start"
                        }
                      >

                        <div className="max-w-[85%] sm:max-w-[65%]">

                          <div
                            className={
                              mine
                                ? "bg-white text-black px-5 py-3.5 rounded-2xl rounded-br-sm shadow-sm"
                                : "bg-[#252525] text-white border border-[#3a3a3a] px-5 py-3.5 rounded-2xl rounded-bl-sm"
                            }
                          >

                            <p className="whitespace-pre-wrap break-words">
                              {item.text}
                            </p>

                          </div>

                          <p
                            className={
                              mine
                                ? "text-xs text-[#666666] text-right mt-2"
                                : "text-xs text-[#666666] text-left mt-2"
                            }
                          >
                            {new Date(
                              item.created_at
                            ).toLocaleString("en-GB")}
                          </p>

                        </div>

                      </div>
                    );
                  })}

                </div>

              )}

            </div>

            {/* ERROR */}

            {error && (

              <div className="mx-4 sm:mx-5 mb-4 bg-[#291717] border border-[#553333] text-[#ffb3b3] rounded-xl px-4 py-3">
                {error}
              </div>

            )}

            {/* SEND */}

            <form
              onSubmit={sendMessage}
              className="border-t border-[#303030] bg-[#1b1b1b] p-4 sm:p-5 flex gap-3"
            >

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Write a message..."
                className="flex-1 min-w-0 bg-[#111111] border border-[#3a3a3a] text-white placeholder-[#666666] rounded-xl px-4 py-3.5 outline-none focus:border-white transition"
              />

              <button
                type="submit"
                disabled={
                  !message.trim() ||
                  sending ||
                  !userId
                }
                className="bg-white hover:bg-gray-200 text-black px-5 sm:px-7 py-3.5 rounded-xl font-black transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending
                  ? "Sending..."
                  : "Send"}
              </button>

            </form>

          </section>

          {/* INFO */}

          <div className="bg-[#1b1b1b] border border-[#303030] rounded-2xl p-5 sm:p-6 mt-6">

            <p className="text-sm text-[#888888]">
              Messages are now connected to your
              Supabase database.
            </p>

          </div>

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
                className="text-white font-semibold"
              >
                Messages
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