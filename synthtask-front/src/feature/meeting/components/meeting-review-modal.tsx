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

import TaskDeleteButton from "@/feature/tasks/components/task-delete-button";
import TaskSaveChangeButton from "@/feature/tasks/components/task-save-change-button";
import CreateNewTaskButton from "@/feature/tasks/components/create-new-task-button";

import type { Task } from "@/lib/meetings-api";

import useMeetingReview from "@/feature/meeting/hooks/use-meeting-review";
import useDeleteTask from "@/feature/tasks/hooks/use-delete-task";
import useSaveChangeTask from "@/feature/tasks/hooks/use-save-change-task";
import useCreateNewTask from "@/feature/tasks/hooks/use-create-new-task";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string | null;
};

export default function MeetingReviewModal({
  open,
  onOpenChange,
  meetingId,
}: Props) {
  const { meeting, loading } = useMeetingReview(meetingId);

  const [tasks, setTasks] = useState<Task[]>([]);
  const { deleting, deleteTask } = useDeleteTask();
  const { saving, saveTask } = useSaveChangeTask();
  const { creating, addTask } = useCreateNewTask();

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
                      <Input
                        className="bg-white"
                        value={t.assignee ?? ""}
                        onChange={(e) =>
                          updateLocalTask(t.id, { assignee: e.target.value })
                        }
                      />
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
