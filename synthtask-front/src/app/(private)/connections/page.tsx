"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import ToolIntegrationCard from "@/components/connections/tool-integration-card";
import {
  toProvider,
  getConnectionStatus,
  disconnectProvider,
  getTrelloAuthUrl,
  getJiraAuthUrl,
} from "@/lib/integrations";
import { setAccessToken } from "@/lib/http";
import type { Provider } from "@/types/providers";
import { Loader2, PlusCircle } from "lucide-react";
import { Skeleton } from "@/ui/skeleton"; // Certifique-se de ter este componente ou use div simples

type Tool = { name: string; provider: Provider };
const TOOLS: Tool[] = [
  { name: "Jira", provider: "jira" },
  { name: "Trello", provider: "trello" },
];

export default function ConnectionsPage() {
  const { data: session, status: authStatus } = useSession();
  const [connectedState, setConnectedState] = useState<Record<Provider, boolean>>({
    jira: false,
    trello: false,
  });
  const [loadingState, setLoadingState] = useState<Record<Provider, boolean>>({
    jira: false,
    trello: false,
  });
  const [isConnectionsLoaded, setIsConnectionsLoaded] = useState(false);
  const [emailState, setEmailState] = useState<Record<Provider, string | null>>({
    jira: null,
    trello: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadConnections() {
      if (authStatus !== "authenticated" || !session) return;

      const token = (session as unknown as { accessToken?: string })?.accessToken;
      if (token) setAccessToken(token);

      try {
        const [trelloRes, jiraRes] = await Promise.allSettled([
          getConnectionStatus("trello"),
          getConnectionStatus("jira"),
        ]);

        const trelloConn =
          trelloRes.status === "fulfilled"
            ? trelloRes.value
            : { connected: false, accountEmail: null };
        const jiraConn =
          jiraRes.status === "fulfilled"
            ? jiraRes.value
            : { connected: false, accountEmail: null };

        if (!mounted) return;
        setConnectedState({
          trello: trelloConn.connected,
          jira: jiraConn.connected,
        });
        setEmailState({
          trello: trelloConn.accountEmail ?? null,
          jira: jiraConn.accountEmail ?? null,
        });
      } catch (e) {
        console.warn("Falha ao verificar conexões:", e);
      } finally {
        if (mounted) setIsConnectionsLoaded(true);
      }
    }

    loadConnections();
    return () => {
      mounted = false;
    };
  }, [authStatus, session]);

  const availableTools = useMemo(
    () =>
      isConnectionsLoaded
        ? TOOLS.filter((t) => !Boolean(connectedState[t.provider]))
        : [],
    [isConnectionsLoaded, connectedState]
  );

  const connectedTools = useMemo(
    () => TOOLS.filter((t) => Boolean(connectedState[t.provider])),
    [connectedState]
  );

  const handleConnect = useCallback(async (toolName: string) => {
    const provider = toProvider(toolName);
    setLoadingState((prev) => ({ ...prev, [provider]: true }));
    try {
      const origin = window.location.origin;
      if (provider === "trello") {
        window.location.href = getTrelloAuthUrl(origin);
        return;
      }
      if (provider === "jira") {
        window.location.href = getJiraAuthUrl(origin);
        return;
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao conectar");
    } finally {
      setLoadingState((prev) => ({ ...prev, [provider]: false }));
    }
  }, []);

  const handleDisconnect = useCallback(async (toolName: string) => {
    const provider = toProvider(toolName);
    setLoadingState((prev) => ({ ...prev, [provider]: true }));
    try {
      await disconnectProvider(provider);
      setConnectedState((prev) => ({ ...prev, [provider]: false }));
      toast.success(`${toolName} desconectado com sucesso.`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao desconectar");
    } finally {
      setLoadingState((prev) => ({ ...prev, [provider]: false }));
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <header className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Conexões
        </h1>
        <p className="text-lg text-muted-foreground">
          Gerencie as integrações com suas ferramentas de trabalho para automação.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {!isConnectionsLoaded && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {isConnectionsLoaded && (
          <>
            {availableTools.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  <PlusCircle className="h-4 w-4" />
                  Disponíveis para conectar
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {availableTools.map((t) => (
                    <ToolIntegrationCard
                      key={t.provider}
                      toolName={t.name}
                      provider={t.provider}
                      connected={Boolean(connectedState[t.provider])}
                      loading={Boolean(loadingState[t.provider])}
                      accountEmail={emailState[t.provider] ?? undefined}
                      onClick={() => handleConnect(t.name)}
                    />
                  ))}
                </div>
              </section>
            )}

            {connectedTools.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600/80 uppercase tracking-wider">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Conectadas e ativas
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {connectedTools.map((t) => (
                    <ToolIntegrationCard
                      key={t.provider}
                      toolName={t.name}
                      provider={t.provider}
                      connected={Boolean(connectedState[t.provider])}
                      loading={Boolean(loadingState[t.provider])}
                      accountEmail={emailState[t.provider] ?? undefined}
                      onClick={() => handleDisconnect(t.name)}
                    />
                  ))}
                </div>
              </section>
            )}

            {availableTools.length === 0 && connectedTools.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma ferramenta encontrada.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}