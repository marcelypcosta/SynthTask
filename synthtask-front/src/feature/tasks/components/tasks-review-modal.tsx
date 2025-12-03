"use client";

import { useEffect, useState } from "react";
import { Trash2, Save, Plus, Loader2 } from "lucide-react"; // Adicionei Loader2

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Skeleton } from "@/ui/skeleton";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

import type { Task } from "@/lib/meetings-api";
import { markMeetingSent } from "@/lib/meetings-api";
import type { Provider } from "@/types/providers";
import {
  listTrelloMembers,
  TrelloMember,
  JiraUser,
  listJiraProjectRoles,
  listJiraRoleActors,
} from "@/lib/integrations";

import useMeetingReview from "@/feature/tasks/hooks/use-tasks-review";
import useDeleteTask from "@/feature/tasks/hooks/use-delete-task";
import useSaveChangeTask from "@/feature/tasks/hooks/use-save-change-task";
import useCreateNewTask from "@/feature/tasks/hooks/use-create-new-task";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string | null;
  provider?: Provider | null;
  targetId?: string | null;
  trelloBoardId?: string | null;
};

export default function TasksReviewModal({
  open,
  onOpenChange,
  meetingId,
  provider = null,
  targetId = null,
  trelloBoardId = null,
}: Props) {
  const { meeting, loading } = useMeetingReview(meetingId);

  const [tasks, setTasks] = useState<Task[]>([]);
  const { deleting, deleteTask } = useDeleteTask();
  const { saveTask } = useSaveChangeTask(); // Removi 'saving' global daqui
  const { creating, addTask } = useCreateNewTask();
  const [sentFlag, setSentFlag] = useState<boolean>(false);

  // Novo estado para controlar qual tarefa específica está sendo salva
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const [members, setMembers] = useState<TrelloMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [jiraUsers, setJiraUsers] = useState<JiraUser[]>([]);
  const [jiraLoading, setJiraLoading] = useState(false);

  const normalize = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  useEffect(() => {
    if (meeting?.tasks) {
      setTasks(meeting.tasks as Task[]);
    }
    const wasSent = Boolean(meeting?.sent);
    setSentFlag(wasSent);
  }, [meeting]);

  const updateLocalTask = (id: string, changes: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...changes } : t))
    );
  };

  useEffect(() => {
    async function loadMembers() {
      if (!open) return;
      if (provider !== "trello") return;
      const boardId = trelloBoardId;
      if (!boardId) return;
      setMembersLoading(true);
      try {
        const data = await listTrelloMembers(String(boardId));
        setMembers(data);
        setTasks((prev) =>
          prev.map((t) => {
            if (provider !== "trello") return t;
            const a = (t.assignee || "").trim();
            if (!a) return t;
            const na = normalize(a);
            const match = data.find((m) => {
              const fn = normalize(String(m.fullName || ""));
              const un = normalize(String(m.username || ""));
              return (
                fn === na ||
                un === na ||
                fn.startsWith(na) ||
                un.startsWith(na) ||
                fn.includes(na) ||
                un.includes(na)
              );
            });
            if (match) return { ...t, assignee: match.id };
            return t;
          })
        );
      } catch (e) {
        setMembers([]);
      } finally {
        setMembersLoading(false);
      }
    }
    loadMembers();
  }, [open, provider, trelloBoardId]);

  useEffect(() => {
    async function loadRoleActorsOnly() {
      if (!open) return;
      if (provider !== "jira") return;
      if (!targetId) return;
      setJiraLoading(true);
      try {
        const roles = await listJiraProjectRoles(String(targetId));
        const preferred =
          roles.find((r) => r.name.toLowerCase() === "administrator") ||
          roles.find((r) => r.name.toLowerCase() === "member") ||
          roles[0];
        if (preferred) {
          const users = await listJiraRoleActors(
            String(targetId),
            preferred.id
          );
          setJiraUsers(users);
          setTasks((prev) =>
            prev.map((t) => {
              if (provider !== "jira") return t;
              const a = (t.assignee || "").trim();
              if (!a) return t;
              const alreadyId = users.some((u) => u.accountId === a);
              if (alreadyId) return t;
              const na = normalize(a);
              const match = users.find((u) => {
                const dn = normalize(String(u.displayName || ""));
                return dn === na || dn.startsWith(na) || dn.includes(na);
              });
              if (match) return { ...t, assignee: match.accountId };
              return t;
            })
          );
        } else {
          setJiraUsers([]);
        }
      } catch {
        setJiraUsers([]);
      } finally {
        setJiraLoading(false);
      }
    }
    loadRoleActorsOnly();
  }, [open, provider, targetId]);

  const handleDelete = async (taskId: string) => {
    if (!meetingId) return;
    const res = await deleteTask(meetingId, taskId);
    if (res.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task removida");
    }
  };

  // Helper para salvar com loading individual
  const handleSaveIndividual = async (task: Task) => {
    if (!meetingId) return;
    setSavingTaskId(task.id); // Ativa loading apenas para este card
    try {
      const res = await saveTask(meetingId, task);
      if (res.success) toast.success("Salvo com sucesso");
    } catch (e) {
      toast.error("Erro ao salvar");
    } finally {
      setSavingTaskId(null); // Desativa loading
    }
  };

  const SendButtonComponent =
    require("@/feature/tasks/components/send-tasks-button").default;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        aria-describedby="meeting-review-description"
      >
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Revisão de Tarefas</DialogTitle>
              <DialogDescription
                id="meeting-review-description"
                className="mt-1"
              >
                Revise os dados antes de enviar.
              </DialogDescription>
            </div>
            {!loading && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!meetingId) return;
                  const res = await addTask(meetingId);
                  if (res.success && res.task)
                    setTasks((prev) => [res.task!, ...prev]);
                }}
                disabled={creating || sentFlag}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Nova Task
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {tasks.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  Nenhuma tarefa encontrada.
                </div>
              )}

              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl border border-border/60 shadow-sm p-5 transition-all hover:border-primary/30 group space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`title-${t.id}`}
                      className="text-xs font-semibold text-muted-foreground uppercase"
                    >
                      Título
                    </Label>
                    <Input
                      id={`title-${t.id}`}
                      value={t.title}
                      onChange={(e) =>
                        updateLocalTask(t.id, { title: e.target.value })
                      }
                      className="font-medium bg-transparent border border-input focus:border-primary h-9"
                      placeholder="Título da tarefa"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`desc-${t.id}`}
                      className="text-xs font-semibold text-muted-foreground uppercase"
                    >
                      Descrição
                    </Label>
                    <Textarea
                      id={`desc-${t.id}`}
                      value={t.description ?? ""}
                      onChange={(e) =>
                        updateLocalTask(t.id, { description: e.target.value })
                      }
                      className="min-h-[100px] bg-neutral-50/50 resize-y text-sm"
                      placeholder="Adicione detalhes..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                      Responsável
                    </Label>
                    {provider === "trello" ? (
                      members.length > 0 ? (
                        <Select
                          value={t.assignee ?? ""}
                          onValueChange={(val) =>
                            updateLocalTask(t.id, { assignee: val })
                          }
                          disabled={membersLoading || !trelloBoardId}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue
                              placeholder={
                                membersLoading
                                  ? "Carregando..."
                                  : "Selecione..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.fullName || m.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={t.assignee ?? ""}
                          onChange={(e) =>
                            updateLocalTask(t.id, { assignee: e.target.value })
                          }
                        />
                      )
                    ) : provider === "jira" ? (
                      <Select
                        value={t.assignee ?? ""}
                        onValueChange={(val) =>
                          updateLocalTask(t.id, { assignee: val })
                        }
                        disabled={jiraLoading || !targetId}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue
                            placeholder={
                              jiraLoading ? "Carregando..." : "Selecione..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {jiraUsers.map((u) => (
                            <SelectItem key={u.accountId} value={u.accountId}>
                              {u.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={t.assignee ?? ""}
                        onChange={(e) =>
                          updateLocalTask(t.id, { assignee: e.target.value })
                        }
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                      Prazo
                    </Label>
                    <Input
                      type="date"
                      value={t.due_date ?? ""}
                      onChange={(e) =>
                        updateLocalTask(t.id, {
                          due_date: e.target.value || null,
                        })
                      }
                      className="h-9"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                      onClick={() => handleSaveIndividual(t)}
                      // Aqui está a correção: desabilita APENAS se o savingTaskId for igual ao ID desta task
                      disabled={savingTaskId === t.id}
                    >
                      {savingTaskId === t.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {savingTaskId === t.id
                        ? "Salvando..."
                        : "Salvar Alterações"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-white flex justify-between items-center sm:justify-between">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {tasks.length} tasks prontas
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            {provider && (
              <SendButtonComponent
                tasks={tasks}
                provider={provider}
                targetId={String(targetId)}
                disabled={sentFlag}
                onSent={async () => {
                  if (!meetingId) return;
                  await markMeetingSent(meetingId);
                  setSentFlag(true);
                  toast.success("Enviado com sucesso!");
                  onOpenChange(false);
                }}
                className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white gap-2 flex-1 sm:flex-none"
              />
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
