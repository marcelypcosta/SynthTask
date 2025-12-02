"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";
import { getProject, updateProjectTarget, deleteProject } from "@/lib/projects";
import { listTargets, listTrelloLists, checkConnected, getTrelloBoardIdForList } from "@/lib/integrations";
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
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [trelloLists, setTrelloLists] = useState<{ id: string; name: string }[]>([]);
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
        if (p.provider === "trello") {
          setSelectedTargetId(p.target_id);
          try {
            const bid = await getTrelloBoardIdForList(p.target_id);
            if (bid) setSelectedBoardId(bid);
            try {
              const data: any = await listTargets("trello");
              const boards = Array.isArray(data?.boards)
                ? data.boards.map((b: any) => ({ id: String(b.id), name: String(b.name ?? b.id) }))
                : [];
              setTargets(boards);
            } catch {}
          } catch {}
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
      if (project.provider === "trello") {
        const boards = Array.isArray(data?.boards)
          ? data.boards.map((b: any) => ({ id: String(b.id), name: String(b.name ?? b.id) }))
          : [];
        setTargets(boards);
        const firstBoard = boards[0]?.id ?? "";
        setSelectedBoardId(firstBoard);
        if (firstBoard) {
          const lists = await listTrelloLists(firstBoard);
          const mapped = lists.map((l) => ({ id: String(l.id), name: String(l.name ?? l.id) }));
          setTrelloLists(mapped);
          setSelectedTargetId(mapped[0]?.id ?? "");
        } else {
          setTrelloLists([]);
          setSelectedTargetId("");
        }
        const availableCount = boards.length;
        if (availableCount === 0) {
          toast.warning("Nenhum destino disponível neste provedor.");
        }
      } else {
        const items = Array.isArray(data?.projects)
          ? data.projects.map((p: any) => ({ id: String(p.id), name: String(p.name ?? p.id) }))
          : [];
        setTargets(items);
        setSelectedTargetId(items[0]?.id ?? "");
        const availableCount = items.length;
        if (availableCount === 0) {
          toast.warning("Nenhum destino disponível neste provedor.");
        }
      }
      setChanging(true);
    } catch {
      toast.error("Falha ao carregar destinos para alteração.");
    } finally {
      setStartingTargets(false);
    }
  };

  const handleSelectBoard = async (boardId: string) => {
    setSelectedBoardId(boardId);
    try {
      const lists = await listTrelloLists(boardId);
      const mapped = lists.map((l) => ({ id: String(l.id), name: String(l.name ?? l.id) }));
      setTrelloLists(mapped);
      setSelectedTargetId(mapped[0]?.id ?? "");
    } catch {
      setTrelloLists([]);
      setSelectedTargetId("");
      toast.error("Falha ao carregar listas do board");
    }
  };

  const handleSaveChange = async () => {
    if (!project || !selectedTargetId) {
      toast.warning("Selecione um destino antes de salvar.");
      return;
    }
    setSavingTarget(true);
    const pid = Number(id);
    const target = project.provider === "trello"
      ? targets.find((b) => b.id === selectedBoardId)
      : targets.find((t) => t.id === selectedTargetId);
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
  };
}
