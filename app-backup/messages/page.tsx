"use client";

import { useEffect, useState } from "react";

type Message = {
  id: number;
  text: string;
  createdAt: string;
};

export default function MessagesPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("sellio-messages");

    if (!saved) {
      return;
    }

    try {
      const parsed: Message[] = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setMessages(parsed);
      }
    } catch {
      console.log("Could not load messages.");
    }
  }, []);

  function sendMessage(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = message.trim();

    if (!text) {
      return;
    }

    const newMessage: Message = {
      id: Date.now(),
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [
      ...messages,
      newMessage,
    ];

    setMessages(updatedMessages);

    localStorage.setItem(
      "sellio-messages",
      JSON.stringify(updatedMessages)
    );

    setMessage("");
  }

  function clearMessages() {
    setMessages([]);

    localStorage.removeItem("sellio-messages");
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}

      <header className="bg-white border-b">

        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">

          <a
            href="/"
            className="text-3xl font-bold text-blue-600"
          >
            Sellio
          </a>

          <div className="flex items-center gap-5">

            <a
              href="/favourites"
              className="text-gray-600 hover:text-blue-600"
            >
              ❤️ Favourites
            </a>

            <a
              href="/"
              className="text-gray-600 hover:text-blue-600"
            >
              ← Home
            </a>

          </div>

        </div>

      </header>

      {/* MESSAGES */}

      <main className="max-w-3xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              💬 Messages
            </h1>

            <p className="text-gray-500 mt-2">
              Your conversations on Sellio.
            </p>

          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear messages
            </button>
          )}

        </div>

        {/* CHAT */}

        <div className="bg-white border rounded-2xl mt-8 overflow-hidden">

          <div className="p-6 border-b">

            <p className="text-sm text-gray-500">
              Conversation
            </p>

            <h2 className="text-xl font-bold mt-1">
              Seller
            </h2>

          </div>

          <div className="min-h-[350px] p-6">

            {messages.length === 0 ? (

              <div className="text-center text-gray-400 py-20">

                <div className="text-5xl">
                  💬
                </div>

                <p className="mt-4">
                  No messages yet.
                </p>

                <p className="text-sm mt-1">
                  Start the conversation below.
                </p>

              </div>

            ) : (

              <div className="space-y-4">

                {messages.map((item) => (

                  <div
                    key={item.id}
                    className="flex justify-end"
                  >

                    <div>

                      <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-br-sm max-w-[280px]">
                        {item.text}
                      </div>

                      <p className="text-xs text-gray-400 text-right mt-1">
                        {new Date(
                          item.createdAt
                        ).toLocaleString("en-GB")}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* SEND */}

          <form
            onSubmit={sendMessage}
            className="border-t p-4 flex gap-3"
          >

            <input
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Write a message..."
              className="flex-1 border rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Send
            </button>

          </form>

        </div>

      </main>

    </main>
  );
}