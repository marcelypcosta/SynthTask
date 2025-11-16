"use client";

import { useEffect, useState } from "react";
import { connectProvider } from "@/lib/integrations";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";

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
  const { data: session, status: authStatus } = useSession();

  useEffect(() => {
    async function run() {
      // Garante que o usuário esteja autenticado e o token injetado
      if (authStatus === "loading") {
        setStatus("Carregando sessão...");
        return;
      }
      if (authStatus !== "authenticated") {
        setStatus("Você precisa estar autenticado para conectar o Trello.");
        return;
      }

      // Injeta explicitamente o token para evitar condição de corrida
      const accessToken = (session as any)?.accessToken ?? null;
      setAccessToken(accessToken);

      const token = extractToken();
      const api_key = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
      if (!token || !api_key) {
        setStatus("Token ou API key ausente. Volte e tente novamente.");
        return;
      }
      try {
        await connectProvider("trello", { api_key, token });
        setStatus("Trello conectado com sucesso. Redirecionando...");
        // Volta para a página de conexões
        setTimeout(() => {
          window.location.href = "/connections";
        }, 1000);
      } catch (e: any) {
        setStatus(e?.message || "Falha ao conectar ao Trello");
      }
    }
    run();
  }, [authStatus, session]);

  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-semibold">Integração Trello</h1>
      <p className="text-neutral-700 mt-2">{status}</p>
    </div>
  );
}