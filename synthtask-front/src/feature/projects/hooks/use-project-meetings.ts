"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";
import { getMeetings, type MeetingListItem } from "@/lib/meetings-api";

export default function useProjectMeetings() {
  const { data: session, status } = useSession();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMeetings();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMeetings(sorted);
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar reuniões");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    const token = (session as any)?.accessToken ?? null;
    if (token) setAccessToken(token);
    load();
  }, [status, session]);

  return { meetings, loading, error, refresh: load };
}
