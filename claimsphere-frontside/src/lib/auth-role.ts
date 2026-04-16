type JwtPayload = {
  role?: string;
  app_metadata?: { role?: string };
  user_metadata?: { role?: string };
};

export function getStoredUserRole(): string | null {
  const storedRole = localStorage.getItem("role");
  if (storedRole) {
    return storedRole;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(parts[1])) as JwtPayload;
    return payload.role || payload.user_metadata?.role || payload.app_metadata?.role || null;
  } catch {
    return null;
  }
}

export function isAdminSession(): boolean {
  return getStoredUserRole() === "admin";
}