const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function apiUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function parseJson(res: Response) {
  return res.json().catch(() => ({}));
}

export async function api<T>(path: string, options: ApiOptions = {}, retried = false): Promise<T> {
  const { body, headers, ...rest } = options;
  const res = await fetch(apiUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && !retried && !path.startsWith("/auth/")) {
    const refreshed = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      return api<T>(path, options, true);
    }
  }

  const data = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(data.code ?? "ERROR", data.message ?? "Có lỗi xảy ra", res.status);
  }
  return data as T;
}
