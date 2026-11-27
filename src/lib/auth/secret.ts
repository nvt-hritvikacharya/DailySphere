import { randomBytes } from "node:crypto";
import { db } from "../db";

const KEY = "session-secret";
let cached: Promise<string> | undefined;

/**
 * SESSION_SECRET when set; otherwise a random key generated once and stored in the database so it
 * survives restarts and is shared by every instance.
 */
export function getSessionSecret(): Promise<string> {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return Promise.resolve(explicit);
  cached ??= loadOrCreate().catch((err) => {
    cached = undefined;
    throw err;
  });
  return cached;
}

async function loadOrCreate() {
  const existing = await db.appSecret.findUnique({ where: { key: KEY } });
  if (existing) return existing.value;
  // createMany + skipDuplicates is an INSERT ... ON CONFLICT DO NOTHING, so concurrent first boots agree.
  await db.appSecret.createMany({ data: [{ key: KEY, value: randomBytes(48).toString("base64url") }], skipDuplicates: true });
  const row = await db.appSecret.findUniqueOrThrow({ where: { key: KEY } });
  return row.value;
}
