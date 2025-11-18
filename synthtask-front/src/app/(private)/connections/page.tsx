"use client";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import ToolIntegrationCard from "@/components/connections/tool-integration-card";
import {
  toProvider,
  checkConnected,
  disconnectProvider,
  getTrelloAuthUrl,
  getJiraAuthUrl,
} from "@/lib/integrations";
import { setAccessToken } from "@/lib/http";
import type { Provider } from "@/types/providers";

type Tool = { name: string; provider: Provider };
const TOOLS: Tool[] = [
  { name: "Jira", provider: "jira" },
  { name: "Trello", provider: "trello" },
];

// Componente
export default function ConnectionsPage() {
  const { data: session, status: authStatus } = useSession();
  const [connectedState, setConnectedState] = useState<
    Record<Provider, boolean>
  >({
    jira: false,
    trello: false,
  });
  const [loadingState, setLoadingState] = useState<Record<Provider, boolean>>({
    jira: false,
    trello: false,
  });
  const [isConnectionsLoaded, setIsConnectionsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadConnections() {
      if (authStatus !== "authenticated" || !session) return;

      const token = (session as unknown as { accessToken?: string })
        ?.accessToken;
      if (token) setAccessToken(token);

      try {
        const [trelloRes, jiraRes] = await Promise.allSettled([
          checkConnected("trello"),
          checkConnected("jira"),
        ]);

        const trello =
          trelloRes.status === "fulfilled" ? trelloRes.value : false;
        const jira = jiraRes.status === "fulfilled" ? jiraRes.value : false;

        if (!mounted) return;
        setConnectedState({ trello, jira });
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
        const url = getTrelloAuthUrl(origin);
        window.location.href = url;
        return;
      }

      if (provider === "jira") {
        const url = getJiraAuthUrl(origin);
        window.location.href = url;
        return;
      }
    } catch (e: any) {
      alert(e?.message || "Falha ao conectar");
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
    } catch (e: any) {
      alert(e?.message || "Falha ao desconectar");
    } finally {
      setLoadingState((prev) => ({ ...prev, [provider]: false }));
    }
  }, []);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-neutral-800 mt-2">
          Conexões
        </h1>
        <p className="text-neutral-600">
          Conecte-se às suas ferramentas de gerenciamento de projetos.
        </p>
      </header>

      <div className="w-full flex flex-col gap-6">
        {!isConnectionsLoaded && (
          <div className="text-neutral-600">Carregando conexões...</div>
        )}

        {isConnectionsLoaded && availableTools.length > 0 && (
          <div className="w-full flex flex-col space-y-4">
            <h2 className="font-medium text-md mb-2">
              Ferramentas disponíveis
            </h2>
            {availableTools.map((t) => (
              <ToolIntegrationCard
                key={t.provider}
                toolName={t.name}
                connected={Boolean(connectedState[t.provider])}
                loading={Boolean(loadingState[t.provider])}
                onClick={() => handleConnect(t.name)}
              />
            ))}
          </div>
        )}

        {isConnectionsLoaded && connectedTools.length > 0 && (
          <div className="w-full flex flex-col space-y-4">
            <h2 className="font-medium text-md mb-2">Ferramentas conectadas</h2>
            {connectedTools.map((t) => (
              <div key={t.provider} className="space-y-2">
                <ToolIntegrationCard
                  toolName={t.name}
                  connected={Boolean(connectedState[t.provider])}
                  loading={Boolean(loadingState[t.provider])}
                  onClick={() => handleDisconnect(t.name)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
