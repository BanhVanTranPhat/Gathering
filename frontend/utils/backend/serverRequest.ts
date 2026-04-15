import "server-only";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
const REQUEST_TIMEOUT_MS = 10000;

type RequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  cache?: RequestCache;
};

export async function serverRequest(
  path: string,
  options: RequestOptions = {},
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return { response, data };
  } catch {
    return { response: null, data: null };
  } finally {
    clearTimeout(timeoutId);
  }
}
