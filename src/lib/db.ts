import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Transaction poolers (PgBouncer, Neon "-pooler" hosts) need Prisma's pgbouncer mode. */
function datasourceUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || url.includes("pgbouncer=")) return undefined;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("pooler") && u.port !== "6543") return undefined;
    u.searchParams.set("pgbouncer", "true");
    return u.toString();
  } catch {
    return undefined;
  }
}

export const db = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: datasourceUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
