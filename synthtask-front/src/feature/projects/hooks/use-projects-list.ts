"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";
import {
  getProjects,
  deleteProject,
  type ProjectListItem,
} from "@/lib/projects";
import { checkConnected } from "@/lib/integrations";

export default function useProjectsList() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (status !== "authenticated" || !session) return;
      const token = (session as any)?.accessToken;
      if (token) setAccessToken(token);

      const items = await getProjects();
      if (!mounted) return;

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
        setProjects(items.filter((p) => !toDelete.includes(p.id)));
      } else {
        setProjects(items);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [status, session]);

  function handleCreated(p: ProjectListItem) {
    setProjects((prev) => [p, ...prev]);
  }

  async function handleDelete(id: number) {
    const ok =
      typeof window !== "undefined"
        ? window.confirm("Tem certeza que deseja excluir este projeto?")
        : true;
    if (!ok) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return { projects, handleCreated, handleDelete };
}
