"use client";

import { useCallback, useState } from "react";
import { deleteTask as deleteTaskApi } from "@/lib/meetings-api";
import { AxiosRequestError } from "@/lib/http";
import { toast } from "sonner";

export default function useDeleteTask() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTask = useCallback(
    async (
      meetingId: string,
      taskId: string
    ): Promise<{ success: boolean; message?: string }> => {
      setDeleting(true);
      setError(null);
      try {
        const message = await deleteTaskApi(meetingId, taskId);
        toast.success(message || "Task deletada com sucesso");
        return { success: true, message };
      } catch (e) {
        const err = e as AxiosRequestError;
        setError(err.message);
        toast.error(err.message || "Falha ao deletar task");
        return { success: false, message: err.message };
      } finally {
        setDeleting(false);
      }
    },
    []
  );

  return { deleting, error, deleteTask, setError };
}
