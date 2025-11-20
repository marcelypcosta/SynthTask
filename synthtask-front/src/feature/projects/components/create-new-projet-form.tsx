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
import { checkConnected, listTargets } from "@/lib/integrations";
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
        return;
      }
      const data: any = await listTargets(provider);
      const items = Array.isArray(data?.boards)
        ? data.boards.map((b: any) => ({ id: String(b.id), name: String(b.name ?? b.id) }))
        : Array.isArray(data?.projects)
        ? data.projects.map((p: any) => ({ id: String(p.id), name: String(p.name ?? p.id) }))
        : [];
      const filtered = items.filter((it: { id: string }) => !usedTargetIds.has(String(it.id)));
      if (!mounted) return;
      setTargets(filtered);
      setTargetId(filtered[0]?.id ?? "");
    }
    loadTargets();
    return () => {
      mounted = false;
    };
  }, [provider, usedTargetIds]);

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
      target_name: target?.name,
    };
    const project = await createProject(payload);
    if (onCreated) onCreated(project);
    setName("");
    setTargetId("");
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
          <Field>
            <FieldLabel htmlFor="target">Board/Projeto</FieldLabel>
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
          <Field orientation="responsive">
            <Button type="submit" disabled={!canSubmit}>
              Criar
            </Button>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
