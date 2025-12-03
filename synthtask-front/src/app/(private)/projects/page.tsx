"use client";

import { useState } from "react";
import { Plus, FolderOpen, FolderPlus, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

import NewProjectCard from "@/components/projects/new-project-card";
import CreateNewProjectForm from "@/feature/projects/components/create-new-projet-form";
import useProjectsList from "@/feature/projects/hooks/use-projects-list";

function providerLabel(p: string) {
  return p === "trello" ? "Trello" : p === "jira" ? "Jira" : p;
}

export default function MyProjectsPage() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { projects, handleCreated, handleDelete, ConfirmDeleteModal } =
    useProjectsList();

  return (
    <main className="flex min-h-svh flex-col items-center p-6 md:p-10">
      {ConfirmDeleteModal}

      <div className="w-full max-w-5xl space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Meus Projetos
            </h1>
            <p className="text-lg text-muted-foreground">
              Gerencie e acompanhe o progresso das suas automações.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
                <DialogDescription>
                  Selecione a ferramenta e configure o destino das tarefas.
                </DialogDescription>
              </DialogHeader>

              <CreateNewProjectForm
                onCreated={(p) => {
                  handleCreated(p);
                  setOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </header>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 mb-4">
              <FolderOpen className="h-10 w-10 text-[#3B82F6]" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Nenhum projeto encontrado
            </h2>
            <p className="text-neutral-500 max-w-md mt-2 mb-6">
              Você ainda não criou nenhum projeto. Comece conectando um quadro
              do Trello ou projeto do Jira para automatizar suas tasks.
            </p>
            <Button
              onClick={() => setOpen(true)}
              className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Criar meu primeiro projeto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <NewProjectCard
                key={p.id}
                id={p.id}
                projectName={p.name}
                boardName={p.target_name ?? ""}
                toolName={providerLabel(p.provider)}
                provider={p.provider}
                onDelete={handleDelete}
              />
            ))}
            {projects.length === 0 && searchTerm && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Nenhum projeto encontrado com o nome "{searchTerm}".
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
