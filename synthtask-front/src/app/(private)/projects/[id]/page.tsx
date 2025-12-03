"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, SquareKanban, Video, Settings2, ArrowLeft, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Separator } from "@/ui/separator";

import MeetingCard from "@/feature/meeting/components/meeting-card";
import TasksReviewModal from "@/feature/tasks/components/tasks-review-modal";

import useProjectDetail from "@/feature/projects/hooks/use-projects-detail";
import useProjectMeetings from "@/feature/meeting/hooks/use-project-meetings";
import { useConfirmDeleteProjectModal } from "@/feature/projects/components/confirm-delete-project-modal";
import { toast } from "sonner";
import Link from "next/link";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const {
    project,
    providerDisconnected,
    changing,
    setChanging,
    targets,
    trelloLists,
    selectedTargetId,
    setSelectedTargetId,
    selectedBoardId,
    handleSelectBoard,
    handleStartChange,
    handleSaveChange,
    handleDeleteProject,
    startingTargets,
    savingTarget,
  } = useProjectDetail(String(id));

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  );
  const { meetings, loading, error, refresh } = useProjectMeetings();
  const { confirm, Modal: ConfirmDeleteModal } = useConfirmDeleteProjectModal();

  const handleRedirect = () => {
    router.push(`/uploads`);
  };

  return (
    <main className="min-h-svh pb-10">
      <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Breadcrumb e Voltar */}
        <div className="flex flex-col gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Projetos
          </Link>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Meus Projetos</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="font-semibold text-foreground">
                {project ? project.name : `Projeto ${id}`}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border rounded-md px-6 py-4 bg-white">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {project ? project.name : "Carregando..."}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">Integração com</span>
              {project ? (
                <Badge variant="secondary" className="bg-[#3B82F6]/10 text-[#3B82F6]">
                  {project.provider === "trello" ? "Trello" : "Jira"}
                </Badge>
              ) : (
                <div className="h-5 w-20 bg-muted animate-pulse rounded" />
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start bg-white">
          <div className="lg:col-span-2 space-y-6 border rounded-md px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Reuniões Recentes
              </h2>
              <Button
                onClick={handleRedirect}
                size="sm"
                className="gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
              >
                <Plus className="h-4 w-4" />
                Nova Reunião
              </Button>
            </div>

            {error && (
              <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {loading && (
              <div className="grid gap-4">
                <div className="h-32 bg-white rounded-xl border border-border/50 animate-pulse shadow-sm" />
                <div className="h-32 bg-white rounded-xl border border-border/50 animate-pulse shadow-sm" />
              </div>
            )}

            {!loading && meetings.length > 0 && (
              <div className="grid gap-4">
                {meetings.map((m) => (
                  <MeetingCard
                    key={m.id}
                    id={m.id}
                    fileName={m.file_name}
                    createdAt={m.created_at}
                    sent={Boolean(m.sent)}
                    onReview={(id) => {
                      if (m.sent) return;
                      setSelectedMeetingId(id);
                      setReviewOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {!loading && meetings.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-10 text-center">
                <div className="rounded-full bg-background p-4 shadow-sm">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    Nenhuma reunião encontrada
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Faça o upload de uma transcrição para que a IA comece a
                    processar suas tarefas.
                  </p>
                </div>
                <Button
                  onClick={handleRedirect}
                  variant="outline"
                  className="mt-2"
                >
                  Fazer Upload Agora
                </Button>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/50 shadow-sm sticky top-6 bg-white">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">
                    Configuração de Destino
                  </CardTitle>
                </div>
                <CardDescription>
                  Para onde as tasks aprovadas são enviadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {providerDisconnected ? (
                  <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    A ferramenta{" "}
                    <strong>
                      {project?.provider === "trello" ? "Trello" : "Jira"}
                    </strong>{" "}
                    está desconectada. Reconecte para continuar.
                  </div>
                ) : !changing ? (
                  <div className="p-3 rounded-md bg-[#3B82F6]/5 border flex items-center gap-3">
                    <div className="bg-white p-2 rounded shadow-sm">
                      <SquareKanban className="h-5 w-5 text-[#3B82F6]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase font-medium">
                        Destino Atual
                      </span>
                      <span className="text-sm font-medium text-foreground line-clamp-1">
                        {project
                          ? project.provider === "trello"
                            ? targets.find((b: any) => b.id === selectedBoardId)
                                ?.name ||
                              project.target_name ||
                              project.target_id
                            : project.target_name ?? project.target_id
                          : "Carregando..."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    {project?.provider === "trello" ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase">
                            Board
                          </label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedBoardId}
                            onChange={(e) => handleSelectBoard(e.target.value)}
                          >
                            {targets.map((t: any) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase">
                            Lista
                          </label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedTargetId}
                            onChange={(e) =>
                              setSelectedTargetId(e.target.value)
                            }
                          >
                            {trelloLists.map((l: any) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase">
                          Projeto Jira
                        </label>
                        <select
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={selectedTargetId}
                          onChange={(e) => setSelectedTargetId(e.target.value)}
                        >
                          {targets.map((t: any) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-0">
                {providerDisconnected ? (
                  <>
                    <Button
                      className="w-full bg-[#3B82F6] text-white"
                      variant="outline"
                      onClick={() => router.push("/connections")}
                    >
                      Gerenciar Conexões
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full bg-[#3B82F6] text-white"
                      onClick={async () => {
                        toast.warning("Confirme a exclusão...");
                        const ok = await confirm();
                        if (!ok) return;
                        try {
                          await handleDeleteProject();
                          toast.success("Projeto excluído");
                          router.push("/projects");
                        } catch (e: any) {
                          toast.error(e?.message);
                        }
                      }}
                    >
                      Excluir Projeto
                    </Button>
                  </>
                ) : !changing ? (
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-[#3B82F6] text-white"
                      onClick={handleStartChange}
                      disabled={startingTargets}
                    >
                      {startingTargets && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      )}
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <div className="flex w-full gap-2">
                    <Button
                      className="flex-1 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
                      onClick={handleSaveChange}
                      disabled={savingTarget}
                    >
                      {savingTarget && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      )}
                      Salvar
                    </Button>
                    <Button variant="ghost" onClick={() => setChanging(false)}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>

        <TasksReviewModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          meetingId={selectedMeetingId}
          provider={project?.provider as "trello" | "jira" | undefined}
          targetId={
            project?.provider === "trello"
              ? selectedTargetId || project?.target_id || undefined
              : (changing ? selectedTargetId : project?.target_id) || undefined
          }
          trelloBoardId={
            project?.provider === "trello"
              ? selectedBoardId || undefined
              : undefined
          }
        />
        {ConfirmDeleteModal}
      </div>
    </main>
  );
}
