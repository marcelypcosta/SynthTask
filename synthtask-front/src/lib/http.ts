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
    const message =
      (data && (data.detail || data.message)) ||
      error.message ||
      "Erro de requisição";
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