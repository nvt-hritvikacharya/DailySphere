import { Prisma } from "@prisma/client";
import { db } from "./db";

type Level = "info" | "warn" | "error";

export function log(level: Level, message: string, context?: Record<string, unknown>) {
  const line = `[${level}] ${message}`;
  if (level === "error") console.error(line, context ?? "");
  else if (level === "warn") console.warn(line, context ?? "");
  else console.log(line, context ?? "");
  db.appLog
    .create({ data: { level, message, context: context as Prisma.InputJsonValue | undefined } })
    .catch(() => undefined);
}

/**
 * Runs a provider call, records health metrics, and returns the fallback on failure
 * so the UI never breaks because a third-party API is down or unconfigured.
 */
export async function withProvider<T>(
  provider: string,
  call: (() => Promise<T>) | null,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (!call) {
    void db.apiLog
      .create({ data: { provider, ok: true, latencyMs: 0, fallback: true, error: "not configured" } })
      .catch(() => undefined);
    return fallback();
  }
  const start = Date.now();
  try {
    const result = await call();
    void db.apiLog
      .create({ data: { provider, ok: true, status: 200, latencyMs: Date.now() - start } })
      .catch(() => undefined);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const status = err instanceof HttpError ? err.status : null;
    void db.apiLog
      .create({ data: { provider, ok: false, status, latencyMs: Date.now() - start, fallback: true, error } })
      .catch(() => undefined);
    log("warn", `Provider ${provider} failed, using fallback`, { error });
    return fallback();
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(init?.timeoutMs ?? 8000),
    cache: "no-store",
  });
  if (!res.ok) throw new HttpError(res.status, `${res.status} ${res.statusText} from ${new URL(url).host}`);
  return (await res.json()) as T;
}
