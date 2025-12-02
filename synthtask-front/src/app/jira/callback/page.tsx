"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken, api, AxiosRequestError } from "@/lib/http";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/card";
import { Loader2, SquareKanban, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

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
  const [status, setStatus] = useState("Conectando ao Jira...");
  const [stage, setStage] = useState<"loading" | "success" | "error">("loading");
  const [resources, setResources] = useState<{ id: string; url: string; name?: string }[]>([]);
  const { data: session, status: authStatus } = useSession();

  useEffect(() => {
    async function run() {
      if (authStatus === "loading") {
        setStatus("Carregando sessão...");
        setStage("loading");
        return;
      }

      if (authStatus !== "authenticated") {
        setStatus("Você precisa estar autenticado para conectar o Jira.");
        setStage("error");
        return;
      }

      const accessToken = (session as any)?.accessToken ?? null;
      setAccessToken(accessToken);

      const code = extractCode();
      const errorParam = extractError();
      const state = extractState();

      if (errorParam) {
        setStatus(`Erro de autorização: ${errorParam}`);
        setStage("error");
        return;
      }

      if (!code) {
        setStatus("Código de autorização ausente. Volte e tente novamente.");
        setStage("error");
        return;
      }

      try {
        const stored = window.sessionStorage.getItem("jira_oauth_state");
        if (!stored || !state || stored !== state) {
          setStatus("Falha de validação do estado. Recomece a autorização.");
          setStage("error");
          return;
        }
      } catch {}

      try {
        const redirectUri =
          process.env.NEXT_PUBLIC_JIRA_REDIRECT_URI || `${window.location.origin}/jira/callback`;
        await api.post("/api/integrations/jira/oauth/exchange", { code, redirect_uri: redirectUri });
        const r = await api.get("/api/integrations/jira/oauth/resources");
        const list = (r.data?.resources as any[]) || [];
        if (list.length > 1) {
          const mapped = list.map((x: any) => ({ id: String(x.id), url: String(x.url || ""), name: String(x.name || "") }));
          setResources(mapped);
          setStatus("Selecione o site do Jira");
          setStage("loading");
          return;
        }
        setStatus("Jira conectado com sucesso! Redirecionando...");
        setStage("success");
        toast.success("Jira conectado com sucesso");
        setTimeout(() => (window.location.href = "/connections"), 1200);
      } catch (e: any) {
        const err = e as AxiosRequestError;
        setStatus(err?.message || "Falha ao conectar ao Jira");
        setStage("error");
        toast.error(err?.message || "Falha ao conectar ao Jira");
      }
    }

    run();
  }, [authStatus, session]);

  const statusColors = {
    loading: "text-neutral-700",
    success: "text-green-600",
    error: "text-destructive",
  };

  const statusIcons = {
    loading: <Loader2 className="h-6 w-6 animate-spin" />,
    success: <CheckCircle2 className="h-6 w-6" />,
    error: <XCircle className="h-6 w-6" />,
  };

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <SquareKanban className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-semibold">Integração Jira</CardTitle>
          </div>
          <CardDescription className="text-neutral-600">
            Conecte sua conta Jira para enviar tasks diretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className={`flex items-center gap-2 ${statusColors[stage]}`}>
            {statusIcons[stage]}
            <span className="font-medium text-center">{status}</span>
          </div>

          <div className="flex flex-col w-full gap-2">
            <Button className="w-full gap-2 justify-center" onClick={() => (window.location.href = "/connections")}>
              Ir para Conexões
              <ArrowRight className="h-4 w-4" />
            </Button>
            {stage === "error" && (
              <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            )}
            {resources.length > 1 && (
              <div className="w-full flex flex-col gap-2">
                {resources.map((r) => (
                  <Button
                    key={r.id}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={async () => {
                      try {
                        setStatus("Aplicando site selecionado...");
                        setStage("loading");
                        await api.post("/api/integrations/jira/oauth/select", { cloud_id: r.id });
                        setResources([]);
                        setStatus("Jira conectado com sucesso! Redirecionando...");
                        setStage("success");
                        toast.success("Site selecionado");
                        setTimeout(() => (window.location.href = "/connections"), 1200);
                      } catch (e: any) {
                        const err = e as AxiosRequestError;
                        setStatus(err?.message || "Falha ao selecionar site");
                        setStage("error");
                        toast.error(err?.message || "Falha ao selecionar site");
                      }
                    }}
                  >
                    <span className="text-left">{r.name || r.url}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
