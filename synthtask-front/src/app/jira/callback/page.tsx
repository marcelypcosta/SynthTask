"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api, AxiosRequestError } from "@/lib/http";
import { setAccessToken } from "@/lib/http";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/card";
import { Loader2, SquareKanban, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function extractCode(): string | null {
  try {
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (!search) return null;
    const params = new URLSearchParams(search);
    return params.get("code");
  } catch {
    return null;
  }
}

function extractError(): string | null {
  try {
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (!search) return null;
    const params = new URLSearchParams(search);
    return params.get("error");
  } catch {
    return null;
  }
}

function extractState(): string | null {
  try {
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (!search) return null;
    const params = new URLSearchParams(search);
    return params.get("state");
  } catch {
    return null;
  }
}

export default function JiraCallbackPage() {
  const [status, setStatus] = useState<string>("Conectando ao Jira...");
  const [stage, setStage] = useState<"loading" | "success" | "error">("loading");
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
      if (errorParam) {
        setStatus(`Erro de autorização: ${errorParam}`);
        setStage("error");
        return;
      }
      const state = extractState();
      if (!code) {
        setStatus("Código de autorização ausente. Volte e tente novamente.");
        setStage("error");
        return;
      }
      try {
        const stored = typeof window !== "undefined" ? window.sessionStorage.getItem("jira_oauth_state") : null;
        if (!stored || !state || stored !== state) {
          setStatus("Falha de validação do estado. Recomece a autorização.");
          setStage("error");
          return;
        }
      } catch {}

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const redirect_env =
        process.env.NEXT_PUBLIC_JIRA_REDIRECT_URI ||
        `${origin}/jira/callback`;
      const redirect_uri = redirect_env.replace(/`/g, "").trim();

      try {
        await api.post("/api/integrations/jira/oauth/exchange", {
          code,
          redirect_uri,
        });
        setStatus("Jira conectado com sucesso. Redirecionando...");
        setStage("success");
        toast.success("Jira conectado com sucesso");
        setTimeout(() => {
          window.location.href = "/connections";
        }, 1000);
      } catch (e: any) {
        const err = e as AxiosRequestError;
        setStatus(err?.message || "Falha ao conectar ao Jira");
        setStage("error");
        toast.error(err?.message || "Falha ao conectar ao Jira");
      }
    }

    run();
  }, [authStatus, session]);

  return (
    <div className="w-full min-h-[60vh] p-6 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <SquareKanban className="h-6 w-6 text-primary" aria-hidden="true" />
            <CardTitle>Integração Jira</CardTitle>
          </div>
          <CardDescription>Conecte sua conta para enviar tasks diretamente.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {stage === "loading" && (
            <div className="flex items-center gap-2 text-neutral-700">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>{status}</span>
            </div>
          )}
          {stage === "success" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>{status}</span>
            </div>
          )}
          {stage === "error" && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" aria-hidden="true" />
              <span>{status}</span>
            </div>
          )}
          <div className="w-full flex flex-col gap-2 mt-2">
            <Button className="w-full gap-2" onClick={() => (window.location.href = "/connections")}> 
              Ir para página de Conexões
            </Button>
            {stage === "error" && (
              <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/connections")}>
                Tentar novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
