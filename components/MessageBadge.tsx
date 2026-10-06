"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

export default function MessageBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadUnreadMessages = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setUnreadCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("messages")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (!error && mounted) {
        setUnreadCount(count ?? 0);
      }
    };

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      channel = supabase
        .channel(`message-badge-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            loadUnreadMessages();
          }
        )
        .subscribe();
    };

    loadUnreadMessages();
    setupRealtime();

    const interval = setInterval(loadUnreadMessages, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <Link
      href="/messages"
      className="relative flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-white transition hover:bg-[#202020]"
      title="Messages"
    >
      <span className="relative text-xl">
        💬

        {unreadCount > 0 && (
          <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>
    </Link>
  );
}