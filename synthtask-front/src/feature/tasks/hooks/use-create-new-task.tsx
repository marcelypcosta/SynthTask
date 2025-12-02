"use client";

import { useCallback, useState } from "react";
import { createTask } from "@/lib/meetings-api";
import type { Task } from "@/lib/meetings-api";
import { AxiosRequestError } from "@/lib/http";
import { toast } from "sonner";

export default function useCreateNewTask() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTask = useCallback(
    async (
      meetingId: string,
      payload?: Partial<Omit<Task, "id">>
    ): Promise<{ success: boolean; task?: Task; message?: string }> => {
      setCreating(true);
      setError(null);
      try {
        const task = await createTask(meetingId, {
          title: payload?.title ?? "Nova tarefa",
          description: payload?.description ?? "",
          assignee: payload?.assignee ?? null,
          due_date: payload?.due_date ?? null,
        });
        toast.success("Task criada com sucesso");
        return { success: true, task };
      } catch (e) {
        const err = e as AxiosRequestError;
        setError(err.message);
        toast.error(err.message || "Falha ao criar task");
        return { success: false, message: err.message };
      } finally {
        setCreating(false);
      }
    },
    []
  );

  return { creating, error, addTask, setError };
}
