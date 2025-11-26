"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/ui/select";
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

import useMeetingReview from "@/feature/projects/hooks/use-meeting-review";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string | null;
  onSaved?: () => void;
};

export default function MeetingReviewModal({
  open,
  onOpenChange,
  meetingId,
}: Props) {
  const { meeting, loading, error, savingTaskIds, scheduleUpdate } =
    useMeetingReview(meetingId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-full max-h-[85vh] overflow-y-auto"
        aria-describedby="meeting-review-description"
      >
        <DialogHeader>
          <DialogTitle>Revisar Tasks da Reunião</DialogTitle>
          <DialogDescription id="meeting-review-description">
            Edite as tasks identificadas pela IA. Alterações são salvas
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!loading && error && <p className="text-destructive">{error}</p>}

        {!loading && meeting && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-neutral-600">{meeting.summary}</div>
            <div className="flex flex-col gap-6">
              {meeting.tasks.map((t) => {
                const isSaving = t.id && savingTaskIds.has(t.id);
                return (
                  <div
                    key={t.id}
                    className="rounded-md border p-4 transition-shadow hover:shadow-sm"
                  >
                    <Field>
                      <FieldLabel>Título</FieldLabel>
                      <FieldContent>
                        <Input
                          defaultValue={t.title}
                          aria-label="Título da task"
                          onChange={(e) =>
                            scheduleUpdate(String(t.id), {
                              title: e.target.value,
                              description: t.description,
                              priority: t.priority,
                              assignee: t.assignee ?? null,
                              due_date: t.due_date ?? null,
                            })
                          }
                        />
                      </FieldContent>
                    </Field>

                    <Field className="mt-3">
                      <FieldLabel>Descrição</FieldLabel>
                      <FieldContent>
                        <Input
                          defaultValue={t.description}
                          aria-label="Descrição da task"
                          onChange={(e) =>
                            scheduleUpdate(String(t.id), {
                              title: t.title,
                              description: e.target.value,
                              priority: t.priority,
                              assignee: t.assignee ?? null,
                              due_date: t.due_date ?? null,
                            })
                          }
                        />
                      </FieldContent>
                    </Field>

                    <div className="mt-3 flex gap-3">
                      <Field className="flex-1">
                        <FieldLabel>Responsável</FieldLabel>
                        <FieldContent>
                          <Input
                            defaultValue={t.assignee ?? ""}
                            aria-label="Responsável"
                            onChange={(e) =>
                              scheduleUpdate(String(t.id), {
                                title: t.title,
                                description: t.description,
                                priority: t.priority,
                                assignee: e.target.value || null,
                                due_date: t.due_date ?? null,
                              })
                            }
                          />
                        </FieldContent>
                      </Field>
                      <Field className="flex-1">
                        <FieldLabel>Prioridade</FieldLabel>
                        <FieldContent>
                          <Select
                            defaultValue={t.priority}
                            onValueChange={(value) =>
                              scheduleUpdate(String(t.id), {
                                title: t.title,
                                description: t.description,
                                priority: value,
                                assignee: t.assignee ?? null,
                                due_date: t.due_date ?? null,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                    </div>

                    {isSaving && (
                      <div className="mt-3 text-xs text-neutral-500 animate-pulse">
                        Salvando alterações...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
