// Applies Prisma migrations during the hosted build. Skips when no database is configured.
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (url === "") {
  console.log("migrate: DATABASE_URL not set, skipping");
  process.exit(0);
}
// migrate deploy takes an advisory lock, which needs a direct (unpooled) connection.
const direct = process.env.DATABASE_URL_UNPOOLED?.trim() || url;
const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: direct },
});
process.exit(r.status ?? 1);
