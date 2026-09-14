import https from "node:https";
import http from "node:http";
import dns from "node:dns";

import { DomainError } from "../models/errors.js";

dns.setDefaultResultOrder("ipv4first");

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "CINEWAVE/1.0 (cinewave-local)",
  Connection: "close",
};

function errorCode(err: unknown) {
  if (!err || typeof err !== "object") return "";
  const direct = "code" in err ? String((err as { code?: string }).code ?? "") : "";
  const cause = "cause" in err ? (err as { cause?: { code?: string } }).cause : undefined;
  return direct || String(cause?.code ?? "");
}

function isRetryable(err: unknown) {
  const code = errorCode(err);
  const message = err instanceof Error ? err.message : String(err);
  return (
    ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT"].includes(
      code,
    ) ||
    message.includes("fetch failed") ||
    message.includes("timeout") ||
    message.includes("HTTP 429") ||
    message.includes("HTTP 5")
  );
}

function requestJson<T>(target: URL): Promise<T> {
  return new Promise((resolve, reject) => {
    const lib = target.protocol === "http:" ? http : https;
    const req = lib.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || undefined,
        path: `${target.pathname}${target.search}`,
        method: "GET",
        family: 4,
        timeout: 20_000,
        headers: HEADERS,
        servername: target.hostname,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          const status = res.statusCode ?? 0;
          if (status === 401 || status === 403) {
            reject(new DomainError("VALIDATION_ERROR", "API key TMDB/OMDb không hợp lệ hoặc bị chặn", 503));
            return;
          }
          if (status >= 400) {
            reject(Object.assign(new Error(`HTTP ${status}`), { code: `HTTP_${status}` }));
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch {
            reject(new Error("JSON không hợp lệ từ máy chủ phim"));
          }
        });
      },
    );
    req.on("timeout", () => {
      req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }));
    });
    req.on("error", reject);
    req.end();
  });
}

export async function fetchJson<T>(url: string | URL, retries = 4): Promise<T> {
  const target = typeof url === "string" ? new URL(url) : url;
  let last: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await requestJson<T>(target);
    } catch (err) {
      if (err instanceof DomainError) throw err;
      last = err;
      if (attempt < retries - 1 && isRetryable(err)) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
        continue;
      }
      throw new DomainError(
        "VALIDATION_ERROR",
        `Không kết nối được ${target.hostname}. Kiểm tra mạng/VPN rồi thử lại.`,
        502,
      );
    }
  }
  throw last instanceof DomainError
    ? last
    : new DomainError("VALIDATION_ERROR", `Không kết nối được ${target.hostname}.`, 502);
}
