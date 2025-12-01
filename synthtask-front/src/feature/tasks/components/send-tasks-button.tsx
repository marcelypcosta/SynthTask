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
};

export default function SendTasksButton({
  tasks,
  provider,
  targetId,
  onSent,
}: Props) {
  const { sending, send } = useSendingTasks();
  const [localResults, setLocalResults] = useState<
    SendTasksResponse["results"]
  >([]);

  async function handleSend() {
    const r = await send(provider, targetId, tasks);
    setLocalResults(r);
    onSent?.(r);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleSend} disabled={sending}>
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
      {localResults.length > 0 && (
        <div className="text-xs text-neutral-600">
          {localResults.map((r, idx) => (
            <div key={idx} className="flex flex-col">
              <span>
                <strong>{r.title}</strong>
              </span>
              <div className="flex flex-col">
                <a
                  className="text-blue-600 underline"
                  href={r.trelloCardUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.trelloCardUrl ? "Trello card" : "Trello card não criado"}
                </a>
                <a
                  className="text-blue-600 underline"
                  href={r.jiraIssueUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.jiraIssueUrl ? "Jira issue" : "Jira issue não criada"}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
