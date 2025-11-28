import axios, { AxiosError, AxiosInstance } from "axios";

// Resolve baseURL de forma segura para cliente e servidor
const baseURL =
  typeof window === "undefined"
    ? process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL
    : process.env.NEXT_PUBLIC_BACKEND_URL;

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class AxiosRequestError extends Error {
  status?: number;
  original?: AxiosError;
  constructor(message: string, status?: number, original?: AxiosError) {
    super(message);
    this.name = "AxiosRequestError";
    this.status = status;
    this.original = original;
  }
}

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor de requisição: injeta Authorization quando disponível
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Interceptor de resposta: normaliza erros em AxiosRequestError
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const data: any = error.response?.data;
    const message = toUserMessage(status, data, error.message);
    return Promise.reject(new AxiosRequestError(message, status, error));
  }
);

// Utilitário para cancelamento de requisições
export function createCancel() {
  const controller = new AbortController();
  return {
    controller,
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}

export function toUserMessage(status?: number, data?: any, fallback?: string) {
  const direct = (data && (data.detail || data.message)) as string | undefined;
  if (direct && String(direct).trim().length > 0) return String(direct);
  switch (status) {
    case 400:
      return "Requisição inválida";
    case 401:
      return "Não autorizado";
    case 403:
      return "Acesso negado";
    case 404:
      return "Recurso não encontrado";
    case 409:
      return "Conflito na operação";
    case 422:
      return "Dados inválidos";
    case 500:
      return "Erro interno no servidor";
    default:
      return fallback || "Erro de requisição";
  }
}
