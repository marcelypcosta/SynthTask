"use client";

import { useCallback, useState } from "react";
import { updateTask } from "@/lib/meetings-api";
import type { Task } from "@/lib/meetings-api";
import { AxiosRequestError } from "@/lib/http";
import { toast } from "sonner";

export default function useSaveChangeTask() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTask = useCallback(
    async (
      meetingId: string,
      task: Task
    ): Promise<{ success: boolean; message?: string }> => {
      setSaving(true);
      setError(null);
      try {
        const message = await updateTask(meetingId, task.id, {
          title: task.title,
          description: task.description,
          priority: task.priority,
          assignee: task.assignee ?? null,
          due_date: task.due_date ?? null,
        });
        toast.success(message || "Alterações salvas com sucesso");
        return { success: true, message };
      } catch (e) {
        const err = e as AxiosRequestError;
        setError(err.message);
        toast.error(err.message || "Falha ao salvar alterações");
        return { success: false, message: err.message };
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return { saving, error, saveTask, setError };
}
