"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Skeleton } from "@/ui/skeleton";
import { Field, FieldContent, FieldLabel } from "@/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

import TaskDeleteButton from "@/feature/tasks/components/task-delete-button";
import TaskSaveChangeButton from "@/feature/tasks/components/task-save-change-button";
import CreateNewTaskButton from "@/feature/tasks/components/create-new-task-button";
import SendTasksButton from "@/feature/tasks/components/send-tasks-button";

import type { Task } from "@/lib/meetings-api";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string | null;
  provider?: Provider | null;
  targetId?: string | null;
};

export default function TasksReviewModal({
  open,
  onOpenChange,
  meetingId,
  provider = null,
  targetId = null,
}: Props) {
  const { meeting, loading } = useMeetingReview(meetingId);

  const [tasks, setTasks] = useState<Task[]>([]);
  const { deleting, deleteTask } = useDeleteTask();
  const { saving, saveTask } = useSaveChangeTask();
  const { creating, addTask } = useCreateNewTask();
  const [members, setMembers] = useState<TrelloMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [jiraUsers, setJiraUsers] = useState<JiraUser[]>([]);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraRoleName, setJiraRoleName] = useState<string | null>(null);

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
      if (!targetId) return;
      setMembersLoading(true);
      try {
        const data = await listTrelloMembers(targetId);
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
  }, [open, provider, targetId]);

  useEffect(() => {
    async function loadRoleActorsOnly() {
      if (!open) return;
      if (provider !== "jira") return;
      if (!targetId) return;
      setJiraLoading(true);
      try {
        const roles = await listJiraProjectRoles(String(targetId));
        // Preferir exatamente Administrator; fallback para Member; senão primeiro disponível
        const preferred =
          roles.find((r) => r.name.toLowerCase() === "administrator") ||
          roles.find((r) => r.name.toLowerCase() === "member") ||
          roles[0];
        if (preferred) {
          const users = await listJiraRoleActors(
            String(targetId),
            preferred.id
          );
          setJiraRoleName(preferred.name);
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-full max-h-[85vh] overflow-y-auto"
        aria-describedby="meeting-review-description"
      >
        <DialogHeader>
          <DialogTitle>Tarefas identificadas</DialogTitle>
          <DialogDescription id="meeting-review-description">
            Acompanhe e, quando necessário, edite, exclua ou crie novas tasks.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        <div className="flex items-center justify-between">
          {!loading && (
            <p className="text-sm text-zinc-500">
              {tasks.length} tasks identificadas.
            </p>
          )}

          {!loading && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-end">
                <CreateNewTaskButton
                  onClick={async () => {
                    if (!meetingId) return;
                    const res = await addTask(meetingId);
                    if (res.success && res.task) {
                      setTasks((prev) => [res.task!, ...prev]);
                    }
                  }}
                  disabled={creating}
                  loading={creating}
                />
              </div>
              <div className="flex justify-end">
                {provider && targetId ? (
                  <SendTasksButton
                    tasks={tasks}
                    provider={provider}
                    targetId={String(targetId)}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>

        {!loading && (
          <div className="flex flex-col gap-6">
            {tasks.length > 0 &&
              tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col items-end space-y-4 rounded-md border p-4 transition-shadow hover:shadow-sm bg-slate-50"
                >
                  <Field>
                    <FieldLabel>Tarefa</FieldLabel>
                    <FieldContent>
                      <Input
                        className="bg-white"
                        value={t.title}
                        onChange={(e) =>
                          updateLocalTask(t.id, { title: e.target.value })
                        }
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Descrição</FieldLabel>
                    <FieldContent>
                      <Input
                        className="bg-white"
                        value={t.description ?? ""}
                        onChange={(e) =>
                          updateLocalTask(t.id, {
                            description: e.target.value,
                          })
                        }
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Responsável</FieldLabel>
                    <FieldContent>
                      {provider === "trello" ? (
                        members.some(
                          (m) => m.id === (t.assignee || "").trim()
                        ) ? (
                          <Select
                            value={t.assignee ?? ""}
                            onValueChange={(val) =>
                              updateLocalTask(t.id, { assignee: val })
                            }
                            disabled={membersLoading || !targetId}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue
                                placeholder={
                                  membersLoading
                                    ? "Carregando..."
                                    : "Selecione o responsável"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.fullName || m.username || m.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className="bg-white"
                            value={t.assignee ?? ""}
                            onChange={(e) =>
                              updateLocalTask(t.id, {
                                assignee: e.target.value,
                              })
                            }
                          />
                        )
                      ) : provider === "jira" ? (
                        jiraUsers.some(
                          (u) => u.accountId === (t.assignee || "").trim()
                        ) ? (
                          <Select
                            value={t.assignee ?? ""}
                            onValueChange={(val) =>
                              updateLocalTask(t.id, { assignee: val })
                            }
                            disabled={jiraLoading || !targetId}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue
                                placeholder={
                                  jiraLoading
                                    ? "Carregando..."
                                    : jiraUsers.length === 0
                                    ? "Nenhum usuário disponível"
                                    : "Selecione o responsável"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {jiraUsers.map((u) => (
                                <SelectItem
                                  key={u.accountId}
                                  value={u.accountId}
                                >
                                  {u.displayName || u.accountId}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className="bg-white"
                            value={t.assignee ?? ""}
                            onChange={(e) =>
                              updateLocalTask(t.id, {
                                assignee: e.target.value,
                              })
                            }
                          />
                        )
                      ) : (
                        <Input
                          className="bg-white"
                          value={t.assignee ?? ""}
                          onChange={(e) =>
                            updateLocalTask(t.id, { assignee: e.target.value })
                          }
                        />
                      )}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Data de Entrega</FieldLabel>
                    <FieldContent>
                      <Input
                        className="bg-white"
                        type="date"
                        value={t.due_date ?? ""}
                        onChange={(e) =>
                          updateLocalTask(t.id, {
                            due_date: e.target.value || null,
                          })
                        }
                      />
                    </FieldContent>
                  </Field>
                  <div className="flex gap-1">
                    <TaskSaveChangeButton
                      onClick={async () => {
                        if (!meetingId) return;
                        const res = await saveTask(meetingId, t);
                        res.success;
                      }}
                      disabled={saving}
                    />
                    <TaskDeleteButton
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
