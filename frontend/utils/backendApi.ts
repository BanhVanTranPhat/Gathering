/**
 * Client gọi backend Gathering (Express + MongoDB).
 * Token lưu localStorage key: gathering_token
 */

const TOKEN_KEY = "gathering_token";
const DEFAULT_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 12000,
);

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
}

async function request<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    rawBody?: BodyInit | null;
    authToken?: string | null;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;
  const token = options.authToken ?? getToken();
  const headers: Record<string, string> = { ...options.headers };
  const hasRawBody = options.rawBody !== undefined;
  if (!hasRawBody) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: hasRawBody
        ? options.rawBody
        : options.body != null
          ? JSON.stringify(options.body)
          : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") {
      throw new ApiError("Yeu cau qua han. Vui long thu lai.", 408);
    }

    const msg = (e as Error)?.message || "";
    if (/failed to fetch|networkerror|load failed/i.test(msg))
      throw new ApiError(
        "Khong ket noi duoc server. Chay backend: cd backend && npm run dev (port 5001).",
        0,
      );
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => "");

  if (res.status === 401) {
    setToken(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gathering:auth-expired"));
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data || res.statusText
        : (data as { message?: string }).message || res.statusText;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  getWithToken: <T = unknown>(path: string, token: string) =>
    request<T>(path, { authToken: token }),
  post: <T = unknown>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body }),
  postForm: <T = unknown>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", rawBody: formData }),
  patch: <T = unknown>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: (path: string) => request(path, { method: "DELETE" }),
};

export async function authLogin(email: string, password: string) {
  const data = await api.post<{
    token: string;
    user: { id: string; email: string; displayName?: string };
  }>("/auth/login", { email, password });
  setToken(data.token);
  return data as {
    token: string;
    user: { id: string; email: string; displayName?: string };
  };
}

export async function authRegister(
  email: string,
  password: string,
  displayName?: string,
) {
  const data = await api.post<{
    token: string;
    user: { id: string; email: string; displayName?: string };
  }>("/auth/register", { email, password, displayName });
  setToken(data.token);
  return data as {
    token: string;
    user: { id: string; email: string; displayName?: string };
  };
}

export async function authGoogle(payload: {
  credential?: string;
  googleId?: string;
  email?: string;
  username?: string;
  avatar?: string;
}) {
  const data = await api.post<{
    token: string;
    user: {
      id: string;
      email: string;
      displayName?: string;
      avatar?: string;
      role?: string;
    };
  }>("/auth/google", payload);
  setToken(data.token);
  return data;
}

export async function authSendOtp(email: string) {
  return api.post<{ sent: boolean; isNewUser: boolean }>("/auth/send-otp", {
    email,
  });
}

export async function authVerifyOtp(
  email: string,
  code: string,
  displayName?: string,
) {
  const data = await api.post<{
    token: string;
    user: { id: string; email: string; displayName?: string; role?: string };
  }>("/auth/verify-otp", { email, code, displayName });
  setToken(data.token);
  return data;
}

export function authLogout() {
  setToken(null);
}
