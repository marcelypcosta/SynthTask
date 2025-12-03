"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken, api, AxiosRequestError } from "@/lib/http";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/ui/card";
import { Input } from "@/ui/input";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Puzzle,
  RotateCcw,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// --- Funções Auxiliares (Mantidas) ---
function extractCode(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
}

function extractError(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("error");
}

function extractState(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("state");
}

export default function JiraCallbackPage() {
  const [status, setStatus] = useState("Validando credenciais...");
  const [stage, setStage] = useState<
    "loading" | "selection" | "success" | "error"
  >("loading");
  const [resources, setResources] = useState<
    { id: string; url: string; name?: string }[]
  >([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");
  const { data: session, status: authStatus } = useSession();

  // --- Lógica Principal (Mantida com ajuste de stages) ---
  useEffect(() => {
    async function run() {
      if (authStatus === "loading") return;

      if (authStatus !== "authenticated") {
        setStatus("Sessão expirada. Faça login novamente.");
        setStage("error");
        return;
      }

      const accessToken = (session as any)?.accessToken ?? null;
      setAccessToken(accessToken);

      const code = extractCode();
      const errorParam = extractError();
      const state = extractState();

      if (errorParam) {
        setStatus(`O Jira recusou a conexão: ${errorParam}`);
        setStage("error");
        return;
      }

      if (!code) {
        setStatus("Código de autorização não encontrado.");
        setStage("error");
        return;
      }

      // Validação de State
      try {
        const stored = window.sessionStorage.getItem("jira_oauth_state");
        if (!stored || !state || stored !== state) {
          setStatus("Erro de segurança (state mismatch). Tente novamente.");
          setStage("error");
          return;
        }
      } catch {}

      // Troca de Token
      try {
        setStatus("Trocando código por token de acesso...");
        const redirectUri =
          process.env.NEXT_PUBLIC_JIRA_REDIRECT_URI ||
          `${window.location.origin}/jira/callback`;

        await api.post("/api/integrations/jira/oauth/exchange", {
          code,
          redirect_uri: redirectUri,
        });

        // Buscar Recursos (Sites)
        setStatus("Buscando sites disponíveis...");
        const r = await api.get("/api/integrations/jira/oauth/resources");
        const list = (r.data?.resources as any[]) || [];

        if (list.length > 1) {
          const mapped = list.map((x: any) => ({
            id: String(x.id),
            url: String(x.url || ""),
            name: String(x.name || ""),
          }));
          setResources(mapped);
          setSelectedId(mapped[0].id); // Seleciona o primeiro por padrão
          setStatus("Selecione qual site deseja conectar");
          setStage("selection");
          return;
        }

        // Se tiver apenas 1 ou nenhum (API vai lidar), finaliza
        setStatus("Conexão estabelecida com sucesso!");
        setStage("success");
        toast.success("Jira conectado!");
        setTimeout(() => (window.location.href = "/connections"), 1500);
      } catch (e: any) {
        const err = e as AxiosRequestError;
        setStatus(err?.message || "Falha na comunicação com o Jira");
        setStage("error");
      }
    }

    run();
  }, [authStatus, session]);

  // --- Filtragem da Lista ---
  const filtered = resources.filter((r) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      String(r.name || "")
        .toLowerCase()
        .includes(term) ||
      String(r.url || "")
        .toLowerCase()
        .includes(term)
    );
  });

  // --- Renderização ---
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="items-center text-center space-y-2 pb-2">
          {/* Ícone Branding */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-2">
            <Puzzle className="h-6 w-6 text-[#3B82F6]" />
          </div>
          <CardTitle className="text-xl font-bold">Integração Jira</CardTitle>
          <CardDescription className="text-center max-w-[90%]">
            {status}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* ESTADO: CARREGANDO */}
          {stage === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-10 w-10 text-[#3B82F6] animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Aguarde um momento...
              </p>
            </div>
          )}

          {/* ESTADO: SUCESSO */}
          {stage === "success" && (
            <div className="flex flex-col items-center justify-center py-6 gap-4 animate-in fade-in zoom-in duration-300">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Você será redirecionado para a página de conexões em instantes.
              </p>
            </div>
          )}

          {/* ESTADO: ERRO */}
          {stage === "error" && (
            <div className="flex flex-col items-center justify-center py-4 gap-4 animate-in fade-in zoom-in duration-300">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/connections">
                  <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                  Voltar para Conexões
                </Link>
              </Button>
            </div>
          )}

          {/* ESTADO: SELEÇÃO */}
          {stage === "selection" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar site..."
                  className="pl-9"
                />
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filtered.map((r) => {
                  const active = selectedId === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        active
                          ? "border-[#3B82F6] bg-blue-50/50"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`p-2 rounded-md ${
                            active ? "bg-white" : "bg-muted"
                          }`}
                        >
                          <Globe
                            className={`h-4 w-4 ${
                              active
                                ? "text-[#3B82F6]"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span
                            className={`text-sm font-medium truncate ${
                              active ? "text-[#3B82F6]" : "text-foreground"
                            }`}
                          >
                            {r.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {r.url}
                          </span>
                        </div>
                      </div>
                      {active && (
                        <CheckCircle2 className="h-4 w-4 text-[#3B82F6] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>

        {/* FOOTER: AÇÕES DE SELEÇÃO */}
        {stage === "selection" && (
          <CardFooter className="flex-col gap-2">
            <Button
              className="w-full gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
              disabled={!selectedId}
              onClick={async () => {
                try {
                  setStatus("Vinculando site selecionado...");
                  setStage("loading"); // Volta para loading visualmente
                  await api.post("/api/integrations/jira/oauth/select", {
                    cloud_id: selectedId,
                  });
                  setResources([]);
                  setStatus("Site vinculado! Redirecionando...");
                  setStage("success");
                  toast.success("Integração concluída");
                  setTimeout(
                    () => (window.location.href = "/connections"),
                    1200
                  );
                } catch (e: any) {
                  const err = e as AxiosRequestError;
                  setStatus(err?.message || "Erro ao salvar seleção");
                  setStage("error");
                  toast.error("Falha ao selecionar site");
                }
              }}
            >
              Confirmar Integração
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              asChild
            >
              <Link href="/connections">Cancelar</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
