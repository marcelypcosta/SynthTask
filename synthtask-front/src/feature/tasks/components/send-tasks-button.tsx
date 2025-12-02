"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Loader2, Send } from "lucide-react";
import type { Task } from "@/lib/meetings-api";
import useSendingTasks from "@/feature/tasks/hooks/use-sending-tasks";
import type { SendTasksResponse } from "@/feature/tasks/types/tasks";
import type { Provider } from "@/types/providers";

type Props = {
  tasks: Task[];
  provider: Provider;
  targetId: string;
  onSent?: (results: SendTasksResponse["results"]) => void;
  disabled?: boolean;
};

export default function SendTasksButton({
  tasks,
  provider,
  targetId,
  onSent,
  disabled = false,
}: Props) {
  const { sending, send } = useSendingTasks();
  const [localResults, setLocalResults] = useState<
    SendTasksResponse["results"]
  >([]);

  async function handleSend() {
    const r = await send(provider, targetId, tasks);
    setLocalResults(r);
    if (r.length === tasks.length) {
      onSent?.(r);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleSend} disabled={sending || disabled}>
        {sending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="h-4 w-4" /> Enviar para{" "}
            {provider === "trello" ? "Trello" : "Jira"}
          </span>
        )}
      </Button>
    </div>
  );
}
