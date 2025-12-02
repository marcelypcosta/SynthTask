"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";
import { connectProvider } from "@/lib/integrations";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/card";
import { Loader2, KanbanSquare, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function extractToken(): string | null {
  if (typeof window === "undefined") return null;
  // Tenta hash (#token=...)
  const hash = window.location.hash;
  if (hash.includes("token=")) {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    return params.get("token");
  }
  // Tenta query (?token=...)
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

export default function TrelloCallbackPage() {
  const [status, setStatus] = useState("Conectando ao Trello...");
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
        setStatus("Você precisa estar autenticado para conectar o Trello.");
        setStage("error");
        return;
      }

      const accessToken = (session as any)?.accessToken ?? null;
      setAccessToken(accessToken);

      const token = extractToken();
      const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
      if (!token || !apiKey) {
        setStatus("Token ou API key ausente. Volte e tente novamente.");
        setStage("error");
        return;
      }

      try {
        await connectProvider("trello", { api_key: apiKey, token });
        setStatus("Trello conectado com sucesso! Redirecionando...");
        setStage("success");
        toast.success("Trello conectado com sucesso");
        setTimeout(() => (window.location.href = "/connections"), 1200);
      } catch (err: any) {
        setStatus(err?.message || "Falha ao conectar ao Trello");
        setStage("error");
        toast.error(err?.message || "Falha ao conectar ao Trello");
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
            <KanbanSquare className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-semibold">Integração Trello</CardTitle>
          </div>
          <CardDescription className="text-neutral-600">
            Conecte sua conta Trello para enviar tasks diretamente.
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
