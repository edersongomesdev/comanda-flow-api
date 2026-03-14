import { getSupabaseAccessToken } from "@/services/supabase";

export const AUTH_TOKEN_STORAGE_KEY = "comanda-flow.auth-token";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");

export class HttpError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

function getStoredLegacyToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export async function getActiveAccessToken() {
  const supabaseToken = await getSupabaseAccessToken();

  if (supabaseToken) {
    return supabaseToken;
  }

  return getStoredLegacyToken();
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function normalizeErrorMessage(data: unknown, status: number) {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      return message.filter((item): item is string => typeof item === "string").join(", ");
    }
  }

  if (status === 401) {
    return "Unauthorized";
  }

  return "Request failed.";
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getActiveAccessToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new HttpError(normalizeErrorMessage(data, response.status), response.status, data);
  }

  return data as T;
}

export const http = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "DELETE" }),
};
