import { PrismaClient } from "@prisma/client";
import { localDateKey } from "../src/lib/dates";

const db = new PrismaClient();

const READERS = [
  { name: "Aarav", email: "aarav@example.com", interests: ["technology", "ai", "cricket", "stocks"], score: 5 },
  { name: "Maya", email: "maya@example.com", interests: ["science", "space", "books", "health"], score: 4 },
  { name: "Leo", email: "leo@example.com", interests: ["football", "formula1", "gaming", "movies"], score: 3 },
  { name: "Zara", email: "zara@example.com", interests: ["travel", "food", "photography", "history"], score: 4 },
  { name: "Kabir", email: "kabir@example.com", interests: ["finance", "business", "crypto", "politics"], score: 2 },
];

async function main() {
  const tz = process.env.SEED_TZ || "Asia/Kolkata";
  const date = localDateKey(tz);

  await db.user.upsert({
    where: { email: "admin@dailysphere.dev" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@dailysphere.dev",
      name: "Admin",
      role: "ADMIN",
      timezone: tz,
      preference: { create: { interests: ["technology", "ai", "science", "business", "space"], onboarded: true } },
    },
  });

  for (const r of READERS) {
    const user = await db.user.upsert({
      where: { email: r.email },
      update: {},
      create: { email: r.email, name: r.name, timezone: tz, preference: { create: { interests: r.interests, onboarded: true } } },
    });
    await db.triviaScore.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: {},
      create: { userId: user.id, date, score: r.score, total: 5, answers: [] },
    });
    for (const [i, c] of r.interests.entries()) {
      await db.history.create({
        data: { userId: user.id, articleId: `seed-${c}-${i}`, title: `Sample ${c} story`, url: `https://example.com/${c}`, source: "Seed", category: c },
      });
    }
  }
  console.log(`Seeded admin + ${READERS.length} readers for ${date}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
