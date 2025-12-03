"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { setAccessToken } from "@/lib/http";
import { connectProvider } from "@/lib/integrations";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/ui/card";
import {
  Loader2,
  SquareKanban,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

// --- Função Auxiliar Mantida ---
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
  const [status, setStatus] = useState("Iniciando conexão segura...");
  const [stage, setStage] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const { data: session, status: authStatus } = useSession();

  useEffect(() => {
    async function run() {
      if (authStatus === "loading") {
        return;
      }

      if (authStatus !== "authenticated") {
        setStatus("Sessão expirada. Faça login novamente.");
        setStage("error");
        return;
      }

      const accessToken = (session as any)?.accessToken ?? null;
      setAccessToken(accessToken);

      const token = extractToken();
      const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;

      if (!token || !apiKey) {
        setStatus("Token de autorização não encontrado.");
        setStage("error");
        return;
      }

      try {
        setStatus("Verificando credenciais do Trello...");
        await connectProvider("trello", { api_key: apiKey, token });

        setStatus("Conexão estabelecida com sucesso!");
        setStage("success");
        toast.success("Trello conectado!");

        // Redirecionamento automático
        setTimeout(() => (window.location.href = "/connections"), 1500);
      } catch (err: any) {
        setStatus(err?.message || "Falha na comunicação com o Trello");
        setStage("error");
        toast.error("Falha na conexão");
      }
    }

    run();
  }, [authStatus, session]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="items-center text-center space-y-2 pb-2">
          {/* Branding Header */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 mb-2">
            <SquareKanban className="h-6 w-6 text-[#0079BF]" />{" "}
            {/* Azul do Trello */}
          </div>
          <CardTitle className="text-xl font-bold">Integração Trello</CardTitle>
          <CardDescription className="text-center max-w-[90%]">
            {status}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 pb-6">
          {/* ESTADO: CARREGANDO */}
          {stage === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-10 w-10 text-[#0079BF] animate-spin" />
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
              <div className="flex flex-col w-full gap-2 mt-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full gap-2 bg-[#0079BF] hover:bg-[#0079BF]/90"
                >
                  <RotateCcw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" asChild className="w-full gap-2">
                  <Link href="/connections">
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Voltar para Conexões
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer (Aparece apenas se não for erro, para evitar botões duplicados) */}
        {stage === "success" && (
          <CardFooter>
            <Button
              className="w-full bg-[#0079BF] hover:bg-[#0079BF]/90 text-white"
              asChild
            >
              <Link href="/connections">
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
