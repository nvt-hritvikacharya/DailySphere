import { Prisma } from "@prisma/client";
import { db } from "./db";

const memory = new Map<string, { value: unknown; expires: number }>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Two-level cache (process memory + Postgres) keyed by e.g. `news:ai:2026-11-26`.
 * Keys include the user-local date, so content naturally rolls over at local midnight.
 */
export async function cached<T>(
  key: string,
  opts: { kind: string; date: string; ttlSeconds: number },
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const mem = memory.get(key);
  if (mem && mem.expires > now) return mem.value as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const p = (async () => {
    try {
      const row = await db.cachedContent.findUnique({ where: { key } });
      if (row && row.expiresAt.getTime() > now) {
        memory.set(key, { value: row.data, expires: row.expiresAt.getTime() });
        return row.data as T;
      }
    } catch {
      // DB unavailable: fall through to the fetcher
    }
    const value = await fetcher();
    const expiresAt = new Date(now + opts.ttlSeconds * 1000);
    memory.set(key, { value, expires: expiresAt.getTime() });
    const data = value as unknown as Prisma.InputJsonValue;
    await db.cachedContent
      .upsert({
        where: { key },
        create: { key, kind: opts.kind, date: opts.date, data, expiresAt },
        update: { data, expiresAt, date: opts.date },
      })
      .catch(() => undefined);
    return value;
  })();

  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

export function clearMemoryCache() {
  memory.clear();
}
