import { api, AxiosRequestError } from "@/lib/http";
import type { Provider } from "@/types/providers";

export function toProvider(toolName: string): Provider {
  const key = toolName.trim().toLowerCase();
  if (key.includes("trello")) return "trello";
  if (key.includes("jira")) return "jira";
  throw new Error(`Ferramenta não suportada: ${toolName}`);
}

export async function checkConnected(provider: Provider): Promise<boolean> {
  try {
    const { data } = await api.get(`/api/integrations/${provider}/status`);
    return Boolean(data?.connected);
  } catch (e) {
    const err = e as AxiosRequestError;
    if (err.status === 400 || err.status === 401) return false;
    return false;
  }
}

export async function getConnectionStatus(provider: Provider): Promise<{ connected: boolean; accountEmail?: string | null }> {
  try {
    const { data } = await api.get(`/api/integrations/${provider}/status`);
    return { connected: Boolean(data?.connected), accountEmail: (data?.account_email as string) ?? null };
  } catch (e) {
    const err = e as AxiosRequestError;
    if (err.status === 400 || err.status === 401) return { connected: false, accountEmail: null };
    return { connected: false, accountEmail: null };
  }
}

export async function connectProvider(
  provider: Provider,
  credentials: Record<string, unknown>
): Promise<void> {
  try {
    await api.post(`/api/integrations/${provider}/connect`, credentials);
  } catch (e) {
    const err = e as AxiosRequestError;
    throw new Error(err.message || "Falha ao conectar provedor");
  }
}

export async function disconnectProvider(provider: Provider): Promise<void> {
  try {
    await api.delete(`/api/integrations/${provider}/connect`);
  } catch (e) {
    const err = e as AxiosRequestError;
    throw new Error(err.message || "Falha ao desconectar provedor");
  }
}

export async function listTargets(provider: Provider): Promise<unknown> {
  const { data } = await api.get(`/api/integrations/${provider}/targets`);
  return data;
}

export interface TrelloMember {
  id: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

export async function listTrelloMembers(
  boardId: string
): Promise<TrelloMember[]> {
  const { data } = await api.get(
    `/api/integrations/trello/boards/${boardId}/members`
  );
  return (data?.members as TrelloMember[]) || [];
}

export interface JiraUser {
  accountId: string;
  displayName?: string;
  emailAddress?: string;
}

export async function listJiraAssignableUsers(
  projectKey: string
): Promise<JiraUser[]> {
  const { data } = await api.get(
    `/api/integrations/jira/projects/${projectKey}/users`
  );
  return (data?.users as JiraUser[]) || [];
}

export interface JiraRole {
  id: string;
  name: string;
}

export async function listJiraProjectRoles(
  projectKey: string
): Promise<JiraRole[]> {
  const { data } = await api.get(
    `/api/integrations/jira/projects/${projectKey}/roles`
  );
  return (data?.roles as JiraRole[]) || [];
}

export async function listJiraRoleActors(
  projectKey: string,
  roleId: string
): Promise<JiraUser[]> {
  const { data } = await api.get(
    `/api/integrations/jira/projects/${projectKey}/roles/${roleId}/actors`
  );
  return (data?.users as JiraUser[]) || [];
}

export function getTrelloAuthUrl(origin: string): string {
  const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_TRELLO_API_KEY não configurada");
  }

  const appName = encodeURIComponent("SynthTask");
  const scope = encodeURIComponent("read,write");
  const expiration = "never";
  const responseType = "token";
  const returnUrl =
    process.env.NEXT_PUBLIC_TRELLO_RETURN_URL || `${origin}/trello/callback`;

  const authorizeUrl = `https://trello.com/1/authorize?key=${apiKey}&name=${appName}&scope=${scope}&expiration=${expiration}&response_type=${responseType}&callback_method=fragment&return_url=${encodeURIComponent(
    returnUrl
  )}`;

  const forceLoginUrl = `https://id.atlassian.com/login?continue=${encodeURIComponent(authorizeUrl)}&prompt=login`;
  return forceLoginUrl;
}

export function getJiraAuthUrl(origin: string): string {
  const clientIdRaw = process.env.NEXT_PUBLIC_JIRA_CLIENT_ID || "";
  const clientId = clientIdRaw.replace(/[`\s]+/g, "").trim();
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_JIRA_CLIENT_ID não configurada");
  }
  const invalidClientId = /[<>\s]/.test(clientId) || clientId.length < 10;
  if (invalidClientId) {
    throw new Error("NEXT_PUBLIC_JIRA_CLIENT_ID inválido");
  }

  const audience = "api.atlassian.com";
  const defaultScopes = [
    "read:me",
    "read:account",
    "read:jira-work",
    "read:jira-user",
    "write:jira-work",
    "read:issue:jira",
    "write:issue:jira",
    "read:user:jira",
    "read:project:jira",
    "read:project.property:jira",
    "read:application-role:jira",
    "read:issue-type:jira",
    "read:group:jira",
    "read:project-role:jira",
    "read:avatar:jira",
    "read:project-category:jira",
  ].join(" ");
  const envScopesRaw = process.env.NEXT_PUBLIC_JIRA_SCOPES;
  const scopes = (() => {
    if (!envScopesRaw) return defaultScopes;
    const cleaned = envScopesRaw.replace(/`/g, "").trim();
    const parts = cleaned.split(/[\s,]+/).filter(Boolean);
    if (!parts.length) return defaultScopes;
    return parts.join(" ");
  })();

  const redirectRaw =
    process.env.NEXT_PUBLIC_JIRA_REDIRECT_URI ||
    `${origin}/jira/callback`;
  const returnUrl = redirectRaw.replace(/`/g, "").trim();
  const invalidRedirect = !/^https?:\/\/.+/.test(returnUrl);
  if (invalidRedirect) {
    throw new Error("NEXT_PUBLIC_JIRA_REDIRECT_URI inválido");
  }

  const state =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("jira_oauth_state", state);
    }
  } catch {}

  const authBaseRaw =
    process.env.NEXT_PUBLIC_JIRA_AUTH_URL ||
    "https://auth.atlassian.com/authorize";
  const authBase = authBaseRaw.replace(/`/g, "").trim();

  const url = `${authBase}?audience=${encodeURIComponent(
    audience
  )}&client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(
    returnUrl
  )}&state=${encodeURIComponent(
    state
  )}&response_type=code&prompt=login`;

  return url;
}
