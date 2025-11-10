"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Plus, SquareKanban, Video } from "lucide-react";

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

  const { id } = use(params);

  const handleRedirect = () => {
    router.push(`/uploads`);
  };

  return (
    <div className="pb-4">
      <div className="my-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Meus Projetos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/components">Projeto {id}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <header className="w-full flex justify-between items-center mb-6">
        <div className="w-full border border-neutral-200 p-4 rounded-md">
          <h1 className="text-2xl font-bold text-gray-900">
            Nome do Projeto {id}
          </h1>
          <p className="text-sm text-gray-500">
            Nome do Boad vinculado - Ferramenta de Gerenciamento
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
            <div className="flex items-center gap-2 bg-neutral-100 p-4 rounded-md">
              <SquareKanban />
              <p className="text-sm">
                Nome do Boad vinculado - Ferramenta de Gerenciamento
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full gap-2">
              <SquareKanban className="h-4 w-4" aria-hidden="true" />
              Alterar Board
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
