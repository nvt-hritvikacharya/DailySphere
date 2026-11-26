import { db } from "../src/lib/db";
import { runDailyRefresh } from "../src/lib/services/refresh";

runDailyRefresh()
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
