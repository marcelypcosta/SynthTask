"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";

import NewProjectCard from "@/components/projects/new-project-card";
import CreateNewProjectForm from "@/feature/projects/components/create-new-projet-form";
import CreateNewProjectButton from "@/feature/projects/components/create-new-project-button";

import { setAccessToken } from "@/lib/http";
import { getProjects, deleteProject, type ProjectListItem } from "@/lib/projects";
import { checkConnected } from "@/lib/integrations";

function providerLabel(p: string) {
  return p === "trello" ? "Trello" : p === "jira" ? "Jira" : p;
}

export default function MyProjectsPage() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (status !== "authenticated" || !session) return;
      const token = (session as any)?.accessToken;
      if (token) setAccessToken(token);
      const items = await getProjects();
      if (!mounted) return;
      setProjects(items);

      const [trello, jira] = await Promise.allSettled([
        checkConnected("trello"),
        checkConnected("jira"),
      ]);
      const connected = {
        trello: trello.status === "fulfilled" ? trello.value : false,
        jira: jira.status === "fulfilled" ? jira.value : false,
      } as const;
      const toDelete = items
        .filter((p) => !connected[p.provider as "trello" | "jira"]) 
        .map((p) => p.id);
      if (toDelete.length) {
        await Promise.allSettled(toDelete.map((id) => deleteProject(id)));
        if (!mounted) return;
        setProjects((prev) => prev.filter((p) => !toDelete.includes(p.id)));
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [status, session]);

  function handleCreated(p: ProjectListItem) {
    setProjects((prev) => [p, ...prev]);
    setOpen(false);
  }

  async function handleDelete(id: number) {
    const ok = typeof window !== "undefined" ? window.confirm("Tem certeza que deseja excluir este projeto?") : true;
    if (!ok) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <header className="w-full flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-800 mt-2">
            Meus Projetos
          </h1>
          <p className="text-neutral-600">
            Gerencie seus projetos de forma eficiente.
          </p>
        </div>
        <CreateNewProjectButton />
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {projects.map((p) => (
          <NewProjectCard
            key={p.id}
            id={p.id}
            projectName={p.name}
            boardName={p.target_name ?? ""}
            toolName={providerLabel(p.provider)}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo projeto.
          </DialogDescription>
        </DialogHeader>
        <CreateNewProjectForm onCreated={handleCreated} />
      </DialogContent>
    </Dialog>
  );
}
