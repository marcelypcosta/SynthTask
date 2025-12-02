"use client";
import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/ui/field";

import type { Provider } from "@/types/providers";
import { checkConnected, listTargets, listTrelloLists } from "@/lib/integrations";
import { createProject, getProjects, type ProjectListItem } from "@/lib/projects";

export default function CreateNewProjectForm({
  onCreated,
}: {
  onCreated?: (p: ProjectListItem) => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<Provider | "">("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]);
  const [targetId, setTargetId] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [trelloLists, setTrelloLists] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadProviders() {
      const [trello, jira] = await Promise.allSettled([
        checkConnected("trello"),
        checkConnected("jira"),
      ]);
      const list: Provider[] = [];
      if (trello.status === "fulfilled" && trello.value) list.push("trello");
      if (jira.status === "fulfilled" && jira.value) list.push("jira");
      if (!mounted) return;
      setProviders(list);
      if (list.length > 0) setProvider(list[0]);
    }
    loadProviders();
    async function loadProjects() {
      try {
        const items = await getProjects();
        if (!mounted) return;
        setProjects(items);
      } catch {}
    }
    loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  const usedTargetIds = useMemo(
    () => new Set(projects.filter((p) => p.provider === provider).map((p) => String(p.target_id))),
    [projects, provider]
  );

  useEffect(() => {
    let mounted = true;
    async function loadTargets() {
      if (!provider) {
        setTargets([]);
        setTargetId("");
        setSelectedBoardId("");
        setTrelloLists([]);
        return;
      }
      const data: any = await listTargets(provider);
      if (provider === "trello") {
        const boards = Array.isArray(data?.boards)
          ? data.boards.map((b: any) => ({ id: String(b.id), name: String(b.name ?? b.id) }))
          : [];
        const filteredBoards = boards.filter((it: { id: string }) => !usedTargetIds.has(String(it.id)));
        if (!mounted) return;
        setTargets(filteredBoards);
        const firstBoard = filteredBoards[0]?.id ?? "";
        setSelectedBoardId(firstBoard);
        if (firstBoard) {
          try {
            const lists = await listTrelloLists(firstBoard);
            const mapped = lists.map((l) => ({ id: String(l.id), name: String(l.name ?? l.id) }));
            setTrelloLists(mapped);
            setTargetId(mapped[0]?.id ?? "");
          } catch {
            setTrelloLists([]);
            setTargetId("");
          }
        } else {
          setTrelloLists([]);
          setTargetId("");
        }
      } else {
        const items = Array.isArray(data?.projects)
          ? data.projects.map((p: any) => ({ id: String(p.id), name: String(p.name ?? p.id) }))
          : [];
        const filtered = items.filter((it: { id: string }) => !usedTargetIds.has(String(it.id)));
        if (!mounted) return;
        setTargets(filtered);
        setTargetId(filtered[0]?.id ?? "");
      }
    }
    loadTargets();
    return () => {
      mounted = false;
    };
  }, [provider, usedTargetIds]);

  useEffect(() => {
    if (provider !== "trello") return;
    let mounted = true;
    async function loadLists() {
      if (!selectedBoardId) {
        setTrelloLists([]);
        setTargetId("");
        return;
      }
      try {
        const lists = await listTrelloLists(selectedBoardId);
        const mapped = lists.map((l) => ({ id: String(l.id), name: String(l.name ?? l.id) }));
        if (!mounted) return;
        setTrelloLists(mapped);
        setTargetId(mapped[0]?.id ?? "");
      } catch {
        if (!mounted) return;
        setTrelloLists([]);
        setTargetId("");
      }
    }
    loadLists();
    return () => {
      mounted = false;
    };
  }, [provider, selectedBoardId]);

  const canSubmit = useMemo(
    () => Boolean(name.trim() && provider && targetId),
    [name, provider, targetId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit || !provider) return;
    if (usedTargetIds.has(String(targetId))) {
      setError("Este destino já está associado a um projeto seu.");
      return;
    }
    const target = targets.find((t) => t.id === targetId);
    const payload = {
      name: name.trim(),
      provider,
      target_id: targetId,
      target_name: provider === "trello" ? trelloLists.find((l) => l.id === targetId)?.name : target?.name,
    };
    const project = await createProject(payload);
    if (onCreated) onCreated(project);
    setName("");
    setTargetId("");
    setSelectedBoardId("");
    setTrelloLists([]);
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldSet>
        <FieldGroup>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Field>
            <FieldLabel htmlFor="project-name">Nome do Projeto</FieldLabel>
            <Input
              id="project-name"
              autoComplete="off"
              placeholder="Digite aqui o nome do projeto"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="provider">Ferramenta</FieldLabel>
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v as Provider)}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Selecione a ferramenta" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p === "trello" ? "Trello" : "Jira"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {provider === "trello" ? (
            <>
              <Field>
                <FieldLabel htmlFor="board">Board</FieldLabel>
                <Select value={selectedBoardId} onValueChange={(v) => setSelectedBoardId(v)}>
                  <SelectTrigger id="board">
                    <SelectValue placeholder="Selecione o board" />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="list">Lista</FieldLabel>
                <Select value={targetId} onValueChange={(v) => setTargetId(v)}>
                  <SelectTrigger id="list">
                    <SelectValue placeholder="Selecione a lista" />
                  </SelectTrigger>
                  <SelectContent>
                    {trelloLists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          ) : (
            <Field>
              <FieldLabel htmlFor="target">Projeto</FieldLabel>
              <Select value={targetId} onValueChange={(v) => setTargetId(v)}>
                <SelectTrigger id="target">
                  <SelectValue placeholder="Selecione o destino das tasks" />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field orientation="responsive" className="justify-end">
            <Button type="submit" disabled={!canSubmit} className="rounded-sm">
              Criar Projeto
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
