"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  SquareKanban,
  Puzzle,
  CheckCircle2,
  Layout,
  List,
  AlertCircle,
  ExternalLink,
  PlugZap,
} from "lucide-react";

import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Separator } from "@/ui/separator";

import { listTargets, listTrelloLists } from "@/lib/integrations";
import { createProject, type ProjectListItem } from "@/lib/projects";
import { toast } from "sonner";
import type { Provider } from "@/types/providers";

type Props = {
  onCreated: (project: ProjectListItem) => void;
};

export default function CreateNewProjectForm({ onCreated }: Props) {
  const [loading, setLoading] = useState(false);

  // States do Formulário
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<Provider | null>(null);

  // Dados externos
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targetId, setTargetId] = useState<string>("");

  const [connectionError, setConnectionError] = useState<
    "expired" | "not_connected" | null
  >(null);

  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [trelloLists, setTrelloLists] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingSubTargets, setLoadingSubTargets] = useState(false);

  useEffect(() => {
    if (!provider) return;

    async function fetchTargets() {
      setLoadingTargets(true);
      setTargets([]);
      setTargetId("");
      setSelectedBoardId("");
      setConnectionError(null);

      try {
        const data: any = await listTargets(provider as Provider);

        if (data?.code === 401) throw { code: 401, message: "Unauthorized" };
        if (data?.code === 400) throw { code: 400, message: data.message };

        let formattedData = [];
        if (provider === "trello") {
          formattedData = Array.isArray(data?.boards)
            ? data.boards.map((b: any) => ({
                id: String(b.id),
                name: String(b.name ?? b.id),
              }))
            : [];
        } else {
          formattedData = Array.isArray(data?.projects)
            ? data.projects.map((p: any) => ({
                id: String(p.id),
                name: String(p.name ?? p.id),
              }))
            : [];
        }
        setTargets(formattedData);
      } catch (e: any) {
        console.error("Erro no fetchTargets:", e);

        const status = e?.code || e?.response?.status;
        const msg = (
          e?.message ||
          e?.response?.data?.message ||
          ""
        ).toLowerCase();

        if (
          status === 401 ||
          msg.includes("unauthorized") ||
          msg.includes("token expired")
        ) {
          setConnectionError("expired");
          toast.error(
            `Sessão do ${provider === "trello" ? "Trello" : "Jira"} expirada.`
          );
        } else if (
          status === 400 ||
          msg.includes("credenciais") ||
          msg.includes("não configurada") ||
          msg.includes("not configured")
        ) {
          setConnectionError("not_connected");
        } else {
          toast.error("Erro ao carregar dados da ferramenta. Tente novamente.");
        }
      } finally {
        setLoadingTargets(false);
      }
    }

    fetchTargets();
  }, [provider]);

  useEffect(() => {
    if (provider !== "trello" || !selectedBoardId) return;

    async function fetchLists() {
      setLoadingSubTargets(true);
      setTrelloLists([]);
      try {
        const data = await listTrelloLists(selectedBoardId);
        const mapped = data.map((l: any) => ({
          id: String(l.id),
          name: String(l.name ?? l.id),
        }));
        setTrelloLists(mapped);
      } catch (e: any) {
        if (e?.code === 401 || e?.response?.status === 401) {
          setConnectionError("expired");
        }
        toast.error("Erro ao carregar listas do Trello.");
      } finally {
        setLoadingSubTargets(false);
      }
    }

    fetchLists();
  }, [provider, selectedBoardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !provider) return;

    const finalTargetId = provider === "trello" ? targetId : targetId;
    if (!finalTargetId) return;

    setLoading(true);
    try {
      let targetName = "";
      if (provider === "trello") {
        targetName = targets.find((b) => b.id === selectedBoardId)?.name || "";
      } else {
        targetName = targets.find((t) => t.id === targetId)?.name || "";
      }

      const newProject = await createProject({
        name,
        provider,
        target_id: finalTargetId,
        target_name: targetName,
      });

      toast.success("Projeto criado com sucesso!");
      if (onCreated) onCreated(newProject);
    } catch (error) {
      toast.error("Falha ao criar projeto.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    name.trim() !== "" &&
    provider !== null &&
    !connectionError &&
    (provider === "trello"
      ? selectedBoardId !== "" && targetId !== ""
      : targetId !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-semibold text-foreground">
          Nome do Projeto
        </Label>
        <Input
          id="name"
          placeholder="Ex: Integração Marketing 2025"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
          autoFocus
          autoComplete="off"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">
          Ferramenta de Destino
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => {
              setProvider("trello");
              setTargetId("");
              setSelectedBoardId("");
            }}
            className={`
              cursor-pointer relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50
              ${
                provider === "trello"
                  ? "border-[#3B82F6] bg-blue-50/50"
                  : "border-border bg-white"
              }
            `}
          >
            <div
              className={`p-2 rounded-lg ${
                provider === "trello" ? "bg-[#0079BF]/10" : "bg-muted"
              }`}
            >
              <SquareKanban
                className={`h-6 w-6 ${
                  provider === "trello"
                    ? "text-[#0079BF]"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <span
              className={`font-medium ${
                provider === "trello"
                  ? "text-[#0079BF]"
                  : "text-muted-foreground"
              }`}
            >
              Trello
            </span>
            {provider === "trello" && (
              <div className="absolute top-2 right-2 text-[#3B82F6]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </div>

          <div
            onClick={() => {
              setProvider("jira");
              setTargetId("");
              setSelectedBoardId("");
            }}
            className={`
              cursor-pointer relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50
              ${
                provider === "jira"
                  ? "border-[#3B82F6] bg-blue-50/50"
                  : "border-border bg-white"
              }
            `}
          >
            <div
              className={`p-2 rounded-lg ${
                provider === "jira" ? "bg-[#0052CC]/10" : "bg-muted"
              }`}
            >
              <Puzzle
                className={`h-6 w-6 ${
                  provider === "jira"
                    ? "text-[#0052CC]"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <span
              className={`font-medium ${
                provider === "jira" ? "text-[#0052CC]" : "text-muted-foreground"
              }`}
            >
              Jira
            </span>
            {provider === "jira" && (
              <div className="absolute top-2 right-2 text-[#3B82F6]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      {provider && (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4">
          {connectionError ? (
            <div className="flex flex-col gap-3 items-start">
              <div className="flex items-center gap-2 text-amber-600 font-medium">
                {connectionError === "expired" ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <PlugZap className="h-5 w-5" />
                )}
                {connectionError === "expired"
                  ? "Conexão Expirada"
                  : "Conta não Conectada"}
              </div>

              <p className="text-sm text-muted-foreground">
                {connectionError === "expired"
                  ? `O token de acesso ao ${
                      provider === "trello" ? "Trello" : "Jira"
                    } expirou.`
                  : `Você ainda não configurou as credenciais do ${
                      provider === "trello" ? "Trello" : "Jira"
                    }.`}{" "}
                É necessário{" "}
                {connectionError === "expired" ? "reconectar" : "conectar"} sua
                conta para listar os projetos.
              </p>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full gap-2 mt-1 bg-white hover:bg-amber-50 border-amber-200 text-amber-800 hover:text-amber-900"
              >
                <Link href="/connections">
                  Ir para Conexões
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground font-bold">
                  <Layout className="h-3 w-3" />
                  {provider === "trello"
                    ? "Selecione o Quadro"
                    : "Selecione o Projeto"}
                </Label>

                {provider === "trello" ? (
                  <Select
                    value={selectedBoardId}
                    onValueChange={setSelectedBoardId}
                    disabled={loadingTargets}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue
                        placeholder={
                          loadingTargets
                            ? "Carregando boards..."
                            : "Selecione..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={targetId}
                    onValueChange={setTargetId}
                    disabled={loadingTargets}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue
                        placeholder={
                          loadingTargets
                            ? "Carregando projetos..."
                            : "Selecione..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {provider === "trello" && selectedBoardId && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground font-bold">
                    <List className="h-3 w-3" />
                    Selecione a Lista de Destino
                  </Label>
                  <Select
                    value={targetId}
                    onValueChange={setTargetId}
                    disabled={loadingSubTargets}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue
                        placeholder={
                          loadingSubTargets
                            ? "Carregando colunas..."
                            : "Selecione a coluna..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {trelloLists.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Separator />

      <Button
        type="submit"
        disabled={loading || !isFormValid}
        className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-medium h-11"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando Projeto...
          </>
        ) : (
          "Finalizar Configuração"
        )}
      </Button>
    </form>
  );
}
