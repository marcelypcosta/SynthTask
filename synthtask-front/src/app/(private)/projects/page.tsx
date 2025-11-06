'use client'

import NewProjectCard from "@/components/projects/new-project-card";
import CreateNewProjectButton from "@/feature/projects/components/create-new-project-button";

interface IProjectCard {
  id: number;
  projectName: string;
  boardName: string;
  toolName: string;
}

const projects: IProjectCard[] = [
  {
    id: 1,
    projectName: "Projeto 1",
    boardName: "Board 1",
    toolName: "Ferramenta 1",
  },
  {
    id: 2,
    projectName: "Projeto 2",
    boardName: "Board 2",
    toolName: "Ferramenta 2",
  },
  {
    id: 3,
    projectName: "Projeto 3",
    boardName: "Board 3",
    toolName: "Ferramenta 3",
  },
];

export default function MyProjectsPage() {
  return (
    <>
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
        {projects.map((project) => (
          <NewProjectCard
            key={project.id}
            id={project.id}
            projectName={project.projectName}
            boardName={project.boardName}
            toolName={project.toolName}
          />
        ))}
      </div>
    </>
  );
}
