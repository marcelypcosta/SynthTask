"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, SquareKanban, Video } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
import { Button } from "@/ui/button";

import BackButton from "@/components/projects/back-button";
import CardMeetings from "@/components/projects/card-meetings";

import { setAccessToken } from "@/lib/http";
import { getProject, updateProjectTarget, deleteProject } from "@/lib/projects";
import { listTargets, checkConnected } from "@/lib/integrations";

import type { Meeting } from "@/types/meetings";

const meetings: Meeting[] = [
  {
    id: 1,
    name: "Reunião 1",
    description: "Reunião de planejamento do projeto",
    data_time: "2024-01-01T10:00:00",
    tasks: [],
  },
  {
    id: 2,
    name: "Reunião 2",
    description: "Reunião de revisão do projeto",
    data_time: "2024-01-02T14:00:00",
    tasks: [],
  },
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { id } = use(params);
  const [project, setProject] = useState<{
    id: number;
    name: string;
    provider: "trello" | "jira";
    target_id: string;
    target_name?: string | null;
  } | null>(null);
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]);
  const [changing, setChanging] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [providerDisconnected, setProviderDisconnected] = useState(false);

  useEffect(() => {
    if (authStatus !== "authenticated" || !session) return;
    const token = (session as unknown as { accessToken?: string })?.accessToken;
    if (token) setAccessToken(token);
    const pid = Number(id);
    getProject(pid)
      .then(async (p) => {
        setProject(p);
        try {
          const connected = await checkConnected(p.provider);
          setProviderDisconnected(!connected);
        } catch {
          setProviderDisconnected(true);
        }
      })
      .catch(() => {});
  }, [authStatus, session, id]);

  const handleStartChange = async () => {
    if (!project) return;
    try {
      const data: any = await listTargets(project.provider);
      const items = Array.isArray(data?.boards)
        ? data.boards.map((b: any) => ({ id: String(b.id), name: String(b.name ?? b.id) }))
        : Array.isArray(data?.projects)
        ? data.projects.map((p: any) => ({ id: String(p.id), name: String(p.name ?? p.id) }))
        : [];
      setTargets(items);
      setSelectedTargetId(items[0]?.id ?? "");
      setChanging(true);
    } catch {}
  };

  const handleSaveChange = async () => {
    if (!project || !selectedTargetId) return;
    const pid = Number(id);
    const target = targets.find((t) => t.id === selectedTargetId);
    const updated = await updateProjectTarget(pid, {
      target_id: selectedTargetId,
      target_name: target?.name,
      provider: project.provider,
    });
    setProject(updated);
    setChanging(false);
  };

  const handleDeleteProject = async () => {
    const pid = Number(id);
    await deleteProject(pid);
    router.push("/projects");
  };

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
            <BreadcrumbItem>{project ? project.name : `Projeto ${id}`}</BreadcrumbItem>
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
              ? `${project.target_name ?? project.target_id} - ${project.provider === "trello" ? "Trello" : "Jira"}`
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
            {meetings.map((meeting) => (
              <CardMeetings key={meeting.id} meeting={meeting} />
            ))}
            {meetings.length === 0 && (
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
                  A ferramenta {project?.provider === "trello" ? "Trello" : "Jira"} está desconectada. Conecte-se ou altere o destino para outra ferramenta.
                </p>
              </div>
            ) : !changing ? (
              <div className="flex items-center gap-2 bg-neutral-100 p-4 rounded-md">
                <SquareKanban />
                <p className="text-sm">
                  {project
                    ? `${project.target_name ?? project.target_id} - ${project.provider === "trello" ? "Trello" : "Jira"}`
                    : "Carregando..."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm text-neutral-700">Selecione o destino</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {providerDisconnected ? (
              <>
                <Button className="w-full" onClick={() => router.push("/connections")}>Conectar ferramenta</Button>
                <Button variant="destructive" className="w-full" onClick={handleDeleteProject}>Excluir projeto</Button>
              </>
            ) : !changing ? (
              <Button className="w-full gap-2" onClick={handleStartChange}>
                <SquareKanban className="h-4 w-4" aria-hidden="true" />
                Alterar Board
              </Button>
            ) : (
              <>
                <Button className="gap-2" onClick={handleSaveChange}>Salvar</Button>
                <Button variant="outline" onClick={() => setChanging(false)}>Cancelar</Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

