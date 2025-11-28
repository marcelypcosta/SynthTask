"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";
import { getProject, updateProjectTarget, deleteProject } from "@/lib/projects";
import { listTargets, checkConnected } from "@/lib/integrations";
import { toast } from "sonner";

type Project = {
  id: number;
  name: string;
  provider: "trello" | "jira";
  target_id: string;
  target_name?: string | null;
};

export default function useProjectDetail(id: string) {
  const { data: session, status: authStatus } = useSession();

  const [project, setProject] = useState<Project | null>(null);
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]);
  const [changing, setChanging] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [providerDisconnected, setProviderDisconnected] = useState(false);
  const [startingTargets, setStartingTargets] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);

  useEffect(() => {
    if (authStatus !== "authenticated" || !session) return;
    const token = (session as any)?.accessToken ?? null;
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
    if (providerDisconnected) {
      toast.warning("Ferramenta desconectada. Conecte-se para alterar o destino.");
      return;
    }
    setStartingTargets(true);
    try {
      const data: any = await listTargets(project.provider);
      const items = Array.isArray(data?.boards)
        ? data.boards.map((b: any) => ({
            id: String(b.id),
            name: String(b.name ?? b.id),
          }))
        : Array.isArray(data?.projects)
        ? data.projects.map((p: any) => ({
            id: String(p.id),
            name: String(p.name ?? p.id),
          }))
        : [];
      setTargets(items);
      setSelectedTargetId(items[0]?.id ?? "");
      setChanging(true);
      if (items.length === 0) {
        toast.warning("Nenhum destino disponível neste provedor.");
      }
    } catch {
      toast.error("Falha ao carregar destinos para alteração.");
    } finally {
      setStartingTargets(false);
    }
  };

  const handleSaveChange = async () => {
    if (!project || !selectedTargetId) {
      toast.warning("Selecione um destino antes de salvar.");
      return;
    }
    setSavingTarget(true);
    const pid = Number(id);
    const target = targets.find((t) => t.id === selectedTargetId);
    try {
      const updated = await updateProjectTarget(pid, {
        target_id: selectedTargetId,
        target_name: target?.name,
        provider: project.provider,
      });
      setProject(updated);
      setChanging(false);
      toast.success("Destino atualizado com sucesso.");
    } catch {
      toast.error("Falha ao salvar alteração de destino.");
    } finally {
      setSavingTarget(false);
    }
  };

  const handleDeleteProject = async () => {
    const pid = Number(id);
    await deleteProject(pid);
  };

  return {
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
  };
}
