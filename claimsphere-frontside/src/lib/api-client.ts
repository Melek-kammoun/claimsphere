const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const getToken = (): string | null => {
  const raw = localStorage.getItem("sb-raizxiwxrkgnhnlccvcx-auth-token");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { access_token?: string };
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = getToken();
  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorPayload = payload as Record<string, unknown>;
    const message =
      typeof payload === "object" && payload !== null
        ? "message" in payload
          ? String(errorPayload.message)
          : "error" in payload
            ? String(errorPayload.error)
            : "Une erreur est survenue."
        : "Une erreur est survenue.";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export { API_BASE_URL };
