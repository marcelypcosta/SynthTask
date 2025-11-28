"use client";

import { useEffect, useState } from "react";
import { connectProvider } from "@/lib/integrations";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/card";
import { Loader2, KanbanSquare, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function extractToken(): string | null {
  try {
    // Tenta hash (#token=...)
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash && hash.includes("token=")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const t = params.get("token");
      if (t) return t;
    }
    // Tenta query (?token=...)
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (search) {
      const params = new URLSearchParams(search);
      const t = params.get("token");
      if (t) return t;
    }
    return null;
  } catch {
    return null;
  }
}

export default function TrelloCallbackPage() {
  const [status, setStatus] = useState<string>("Conectando ao Trello...");
  const [stage, setStage] = useState<"loading" | "success" | "error">("loading");
  const { data: session, status: authStatus } = useSession();

  useEffect(() => {
    async function run() {
      // Garante que o usuário esteja autenticado e o token injetado
      if (authStatus === "loading") {
        setStatus("Carregando sessão...");
        setStage("loading");
        return;
      }
      if (authStatus !== "authenticated") {
        setStatus("Você precisa estar autenticado para conectar o Trello.");
        setStage("error");
        return;
      }

      // Injeta explicitamente o token para evitar condição de corrida
      const accessToken = (session as any)?.accessToken ?? null;
      setAccessToken(accessToken);

      const token = extractToken();
      const api_key = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
      if (!token || !api_key) {
        setStatus("Token ou API key ausente. Volte e tente novamente.");
        setStage("error");
        return;
      }
      try {
        await connectProvider("trello", { api_key, token });
        setStatus("Trello conectado com sucesso. Redirecionando...");
        setStage("success");
        toast.success("Trello conectado com sucesso");
        // Volta para a página de conexões
        setTimeout(() => {
          window.location.href = "/connections";
        }, 1000);
      } catch (e: any) {
        setStatus(e?.message || "Falha ao conectar ao Trello");
        setStage("error");
        toast.error(e?.message || "Falha ao conectar ao Trello");
      }
    }
    run();
  }, [authStatus, session]);

  return (
    <div className="w-full min-h-[60vh] p-6 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-primary" aria-hidden="true" />
            <CardTitle>Integração Trello</CardTitle>
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
          <div className="w-full flex gap-2 mt-2">
            <Button className="w-full gap-2" onClick={() => (window.location.href = "/connections")}>
              <ArrowRight className="h-4 w-4" />
              Ir para Conexões
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
