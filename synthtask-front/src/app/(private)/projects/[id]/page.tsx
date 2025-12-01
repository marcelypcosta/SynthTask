"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, SquareKanban, Video, Loader2 } from "lucide-react";

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

import BackButton from "@/components/projects/back-button";
import MeetingCard from "@/feature/meeting/components/meeting-card";
import TasksReviewModal from "@/feature/tasks/components/tasks-review-modal";

import useProjectDetail from "@/feature/projects/hooks/use-projects-detail";
import useProjectMeetings from "@/feature/meeting/hooks/use-project-meetings";
import { useConfirmDeleteProjectModal } from "@/feature/projects/components/confirm-delete-project-modal";
import { toast } from "sonner";

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
    selectedTargetId,
    setSelectedTargetId,
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
    <div className="w-full pb-4">
      <BackButton />
      <div className="my-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Meus Projetos</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {project ? project.name : `Projeto ${id}`}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <header className="w-full flex justify-between items-center mb-6">
        <div className="w-full border border-neutral-200 p-4 rounded-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {project ? project.name : `Projeto ${id}`}
          </h1>
          <p className="text-sm text-gray-500">
            {project
              ? `${project.target_name ?? project.target_id} - ${
                  project.provider === "trello" ? "Trello" : "Jira"
                }`
              : "Carregando destino..."}
          </p>
        </div>
      </header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 justify-center items-start gap-6 mb-6">
        {/* Seção de Reuniões recentes */}
        <Card className="w-full bg-white rounded-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Reuniões recentes</CardTitle>

            <CardDescription>
              Selecione a reunião e aprove suas tasks e envie para sua
              ferramente de gerenciamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            {error && <p className="text-destructive">{error}</p>}
            {loading && (
              <div className="space-y-2">
                <div className="h-10 bg-neutral-200 animate-pulse rounded-sm" />
                <div className="h-10 bg-neutral-200 animate-pulse rounded-sm" />
              </div>
            )}
            {!loading && meetings.length > 0 && (
              <div className="flex flex-col gap-4">
                {meetings.map((m) => (
                  <MeetingCard
                    key={m.id}
                    id={m.id}
                    fileName={m.file_name}
                    createdAt={m.created_at}
                    onReview={(id) => {
                      setSelectedMeetingId(id);
                      setReviewOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
            {!loading && meetings.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-200 bg-neutral-100 p-8 text-center">
                <Video
                  className="h-6 w-6 text-neutral-400"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium text-neutral-700">
                  Nenhuma reunião encontrada
                </h3>
                <p className="text-sm text-neutral-500">
                  Faça o upload de uma nova reunião para começar.
                </p>
                <Button
                  onClick={handleRedirect}
                  className="mt-2 flex items-center justify-center gap-2"
                  aria-label="Upload de nova reunião"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Upload de nova reunião
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm font-semibold text-neutral-500">
            {meetings.length}{" "}
            {meetings.length === 1
              ? "Reunião disponível"
              : "Reuniões disponíveis"}{" "}
            para envio.
          </CardFooter>
        </Card>
        <TasksReviewModal
          open={reviewOpen}
          onOpenChange={(o) => setReviewOpen(o)}
          meetingId={selectedMeetingId}
          provider={project?.provider as "trello" | "jira" | undefined}
          targetId={
            (changing ? selectedTargetId : project?.target_id) || undefined
          }
        />

        {/* Seção de Configuração de Board */}
        <Card className="w-full bg-white rounded-sm lg:col-span-1">
          <CardHeader>
            <CardTitle> Destino das Tasks</CardTitle>
            <CardDescription>
              As tasks aprovadas serão enviadas automaticamente para:
            </CardDescription>
          </CardHeader>
          <CardContent>
            {providerDisconnected ? (
              <div className="flex flex-col gap-3 rounded-md border border-dashed border-neutral-200 bg-neutral-100 p-4">
                <p className="text-sm text-neutral-700">
                  A ferramenta{" "}
                  {project?.provider === "trello" ? "Trello" : "Jira"} está
                  desconectada. Conecte-se ou altere o destino para outra
                  ferramenta.
                </p>
              </div>
            ) : !changing ? (
              <div className="flex items-center gap-2 bg-neutral-100 p-4 rounded-md">
                <SquareKanban />
                <p className="text-sm">
                  {project
                    ? `${project.target_name ?? project.target_id} - ${
                        project.provider === "trello" ? "Trello" : "Jira"
                      }`
                    : "Carregando..."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm text-neutral-700">
                  Selecione o destino
                </label>
                <select
                  className="w-full border rounded-md p-2"
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                >
                  {targets.map((t: { id: string; name: string }) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {providerDisconnected ? (
              <>
                <Button
                  className="w-full"
                  onClick={() => router.push("/connections")}
                >
                  Conectar ferramenta
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={async () => {
                    toast.warning("Confirme a exclusão do projeto.");
                    const ok = await confirm();
                    if (!ok) return;
                    try {
                      await handleDeleteProject();
                      toast.success("Projeto excluído com sucesso.");
                      router.push("/projects");
                    } catch (e: any) {
                      toast.error(e?.message || "Falha ao excluir projeto.");
                    }
                  }}
                >
                  Excluir projeto
                </Button>
              </>
            ) : !changing ? (
              <Button className="w-full gap-2" onClick={handleStartChange} disabled={startingTargets}>
                {startingTargets ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <SquareKanban className="h-4 w-4" aria-hidden="true" />
                )}
                Alterar Board
              </Button>
            ) : (
              <>
                <Button className="gap-2" onClick={handleSaveChange} disabled={savingTarget}>
                  {savingTarget ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setChanging(false)}>
                  Cancelar
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
        {ConfirmDeleteModal}
      </div>
    </div>
  );
}
