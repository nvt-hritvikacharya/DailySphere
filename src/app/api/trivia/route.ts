import { NextResponse } from "next/server";
import { z } from "zod";
import { getTodayKey, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getTriviaWithAnswers } from "@/lib/providers/daily";

async function leaderboard(date: string, viewerId: string) {
  const rows = await db.triviaScore.findMany({
    where: { date },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: 10,
    include: { user: { select: { name: true } } },
  });
  return rows.map((r, i) => ({
    rank: i + 1,
    name: (r.user.name ?? "Reader").split(/[\s@._]/)[0] || "Reader",
    score: r.score,
    total: r.total,
    you: r.userId === viewerId,
  }));
}

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const date = await getTodayKey();
  const questions = await getTriviaWithAnswers(date);
  const existing = await db.triviaScore.findUnique({ where: { userId_date: { userId: user.id, date } } });
  return NextResponse.json({
    date,
    // Answers are only revealed after the user has submitted for the day.
    questions: questions.map(({ answer, ...q }) => (existing ? { ...q, answer } : q)),
    result: existing ? { score: existing.score, total: existing.total, answers: existing.answers } : null,
    leaderboard: await leaderboard(date, user.id),
  });
}

const schema = z.object({ answers: z.array(z.string()).length(5) });

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Answer all 5 questions" }, { status: 400 });
  const date = await getTodayKey();
  const existing = await db.triviaScore.findUnique({ where: { userId_date: { userId: user.id, date } } });
  if (existing) return NextResponse.json({ error: "Already played today" }, { status: 409 });

  const questions = await getTriviaWithAnswers(date);
  const score = questions.reduce((s, q, i) => s + (q.answer === parsed.data.answers[i] ? 1 : 0), 0);
  await db.triviaScore.create({
    data: { userId: user.id, date, score, total: questions.length, answers: parsed.data.answers },
  });
  return NextResponse.json({
    score,
    total: questions.length,
    correct: questions.map((q) => q.answer),
    leaderboard: await leaderboard(date, user.id),
  });
}
