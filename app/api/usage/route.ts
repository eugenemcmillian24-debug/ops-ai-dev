import { auth } from "@/lib/auth";
import { db, usageLogs, transactions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  const [logs, txns] = await Promise.all([
    db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId))
      .orderBy(desc(usageLogs.timestamp))
      .limit(50),
    db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(10),
  ]);

  const totalSpent = logs.reduce((sum, log) => sum + log.creditsUsed, 0);
  const actionBreakdown = logs.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] ?? 0) + log.creditsUsed;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    logs,
    transactions: txns,
    totalSpent,
    actionBreakdown,
  });
}
