"use client";

import { useState } from "react";

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

import useProjectsList from "@/feature/projects/hooks/use-projects-list";

function providerLabel(p: string) {
  return p === "trello" ? "Trello" : p === "jira" ? "Jira" : p;
}

export default function MyProjectsPage() {
  const [open, setOpen] = useState(false);
  const { projects, handleCreated, handleDelete, ConfirmDeleteModal } =
    useProjectsList();

  return (
    <>
      {ConfirmDeleteModal}
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
          <CreateNewProjectForm
            onCreated={(p) => {
              handleCreated(p);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
