const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

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
  console.log("raw token:", raw); 

  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { access_token?: string };
    console.log("access_token:", parsed.access_token);
    return parsed.access_token ?? null;
  } catch {
    console.error("Failed to parse auth token");
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
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String(payload.error)
        : "Une erreur est survenue pendant l'appel API.";

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export { API_BASE_URL };