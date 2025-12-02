"use client";

import { useState } from "react";
import { api, AxiosRequestError } from "@/lib/http";
import type { Task } from "@/lib/meetings-api";
import type {
  SendTasksResponse,
  SendingTask,
} from "@/feature/tasks/types/tasks";
import type { Provider } from "@/types/providers";

export default function useSendingTasks() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SendTasksResponse["results"]>([]);

  async function send(
    provider: Provider,
    targetId: string,
    tasks: Task[]
  ): Promise<SendTasksResponse["results"]> {
    setSending(true);
    setError(null);
    setResults([]);
    try {
      const items: SendingTask[] = tasks.map((t) => {
        const rawAssignee = (t.assignee ?? "").trim();
        const trelloIdPattern = /^[0-9a-fA-F]{24}$/;
        const normalizedAssignee =
          provider === "trello"
            ? trelloIdPattern.test(rawAssignee)
              ? rawAssignee
              : null
            : rawAssignee || null;
        return {
          title: t.title,
          description: t.description ?? null,
          due_date: t.due_date ?? null,
          assignee: normalizedAssignee,
        };
      });

      const responses = await Promise.all(
        items.map(async (it) => {
          const { data } = await api.post<{ result: any }>(
            `/api/integrations/${provider}/tasks`,
            { target_id: targetId, task: it }
          );
          const res = data.result || {};
          const trelloUrl =
            provider === "trello"
              ? (res.url as string | undefined) || null
              : null;
          const jiraUrl =
            provider === "jira"
              ? (res.url as string | undefined) || null
              : null;
          return {
            title: it.title,
            trelloCardUrl: trelloUrl,
            jiraIssueUrl: jiraUrl,
            assignee: it.assignee ?? null,
          } as SendTasksResponse["results"][number];
        })
      );
      setResults(responses);
      return responses;
    } catch (e) {
      const err = e as AxiosRequestError;
      setError(err.message || "Falha no envio");
      return [];
    } finally {
      setSending(false);
    }
  }

  return { sending, error, results, send } as const;
}
