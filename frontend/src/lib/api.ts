const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

const API_BASE = `${API_URL}/api`;

function getToken() {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  const token = getToken();

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${cleanPath}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ??
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

export async function downloadFile(path: string) {
  const token = getToken();

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_BASE}${cleanPath}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(
      (data as { error?: string }).error ?? "Export failed"
    );
  }

  const blob = await response.blob();

  const disposition =
    response.headers.get("content-disposition") ?? "";

  const match = disposition.match(/filename="([^"]+)"/);

  const filename = match?.[1] ?? "export.bin";

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export type Role =
  | "ADMIN"
  | "MENTOR"
  | "TEAM_LEADER"
  | "TEAM_MEMBER";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  studentProfile: any;
  mentorProfile: any;
}

export function homeForRole(role: Role) {
  if (role === "ADMIN") return "/admin";

  if (role === "MENTOR") return "/mentor";

  return "/app";
}