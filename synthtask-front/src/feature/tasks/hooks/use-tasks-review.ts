"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/http";
import type { ProcessedMeeting, Task } from "@/lib/meetings-api";

type UpdatePayload = Omit<Task, "id">;

export default function useMeetingReview(meetingId: string | null) {
  const [meeting, setMeeting] = useState<ProcessedMeeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingTaskIds, setSavingTaskIds] = useState<Set<string>>(new Set());
  const timers = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!meetingId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/meetings/${meetingId}`);
        if (mounted) setMeeting(data);
      } catch (e: any) {
        console.error(e?.message || "Falha ao carregar reunião");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [meetingId]);

  function scheduleUpdate(taskId: string, payload: UpdatePayload, delay = 500) {
    if (!meetingId) return;
    if (timers.current[taskId]) clearTimeout(timers.current[taskId]);
    timers.current[taskId] = setTimeout(async () => {
      setSavingTaskIds((prev) => new Set(prev).add(taskId));
      try {
        await api.put(`/api/meetings/${meetingId}/tasks/${taskId}`, payload);
        setMeeting((prev) =>
          prev
            ? {
                ...prev,
                tasks: prev.tasks.map((t) =>
                  t.id === taskId ? { ...t, ...payload } : t
                ),
              }
            : prev
        );
      } catch (e: any) {
        console.error(e?.message || "Falha ao salvar alterações");
      } finally {
        setSavingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    }, delay);
  }

  return {
    meeting,
    loading,
    savingTaskIds,
    scheduleUpdate,
  };
}
