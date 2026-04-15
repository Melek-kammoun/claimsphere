const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
  import.meta.env.VITE_NEST_API_URL?.replace(/\/$/, "") ??
  "/api";

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

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("token");
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
