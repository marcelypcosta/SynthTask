"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api, AxiosRequestError } from "@/lib/http";
import { setAccessToken } from "@/lib/http";

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

export default function JiraCallbackPage() {
  const [status, setStatus] = useState<string>("Conectando ao Jira...");
  const { data: session, status: authStatus } = useSession();

  useEffect(() => {
    async function run() {
      if (authStatus === "loading") {
        setStatus("Carregando sessão...");
        return;
      }
      if (authStatus !== "authenticated") {
        setStatus("Você precisa estar autenticado para conectar o Jira.");
        return;
      }

      const accessToken = (session as any)?.accessToken ?? null;
      setAccessToken(accessToken);

      const code = extractCode();
      if (!code) {
        setStatus("Código de autorização ausente. Volte e tente novamente.");
        return;
      }

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const redirect_uri =
        process.env.NEXT_PUBLIC_JIRA_REDIRECT_URI ||
        `${origin}/jira/callback`;

      try {
        await api.post("/api/integrations/jira/oauth/exchange", {
          code,
          redirect_uri,
        });
        setStatus("Jira conectado com sucesso. Redirecionando...");
        setTimeout(() => {
          window.location.href = "/connections";
        }, 1000);
      } catch (e: any) {
        const err = e as AxiosRequestError;
        setStatus(err?.message || "Falha ao conectar ao Jira");
      }
    }

    run();
  }, [authStatus, session]);

  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-semibold">Integração Jira</h1>
      <p className="text-neutral-700 mt-2">{status}</p>
    </div>
  );
}