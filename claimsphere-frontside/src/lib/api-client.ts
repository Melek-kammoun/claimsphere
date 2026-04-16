const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL non défini, utilisation de http://localhost:4000");
}

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
  // Get the Supabase auth token from localStorage
  const raw = localStorage.getItem("sb-raizxiwxrkgnhnlccvcx-auth-token");
  console.log("Raw token from localStorage:", raw);

  if (!raw) {
    console.warn("No auth token found in localStorage");
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { access_token?: string };
    const token = parsed.access_token;
    console.log("Extracted access_token:", token ? token.substring(0, 20) + "..." : "null");
    return token ?? null;
  } catch (error) {
    console.error("Failed to parse auth token:", error);
    return null;
  }
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = getToken();
  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;

  console.log("🔍 API Request:", { url, hasToken: !!token, method: options.method || "GET" });

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

  console.log("📨 API Response:", { status: response.status, ok: response.ok, payload });

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String(payload.error)
        : typeof payload === "object" && payload !== null && "message" in payload
        ? String(payload.message)
        : "Une erreur est survenue pendant l'appel API.";

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export { API_BASE_URL };