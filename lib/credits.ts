import { db, users, usageLogs } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const ACTION_COSTS = {
  terminalMessage: 50,
  agentRun: 2000,
  webcontainerMinute: 50,
  deployment: 1000,
  mobileExport: 900,
  securityScan: 1500,
  projectSave: 100,
} as const;

export type ActionType = keyof typeof ACTION_COSTS;

export const CREDIT_PACKS = [
  { id: "1k", credits: 1000, price: 10, label: "Starter" },
  { id: "5k", credits: 5000, price: 45, label: "Builder" },
  { id: "10k", credits: 10000, price: 85, label: "Pro" },
  { id: "50k", credits: 50000, price: 375, label: "Studio" },
  { id: "100k", credits: 100000, price: 650, label: "Enterprise" },
] as const;

export type CreditPack = (typeof CREDIT_PACKS)[number];

export function predictCost(action: ActionType): number {
  return ACTION_COSTS[action];
}

export async function getUserCredits(userId: number): Promise<number> {
  const result = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0]?.credits ?? 0;
}

export async function deductCredits(
  userId: number,
  amount: number,
  action: ActionType,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; remaining: number }> {
  const result = await db
    .update(users)
    .set({
      credits: sql`GREATEST(0, ${users.credits} - ${amount})`,
    })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits });

  const remaining = result[0]?.credits ?? 0;

  if (remaining === 0 && amount > 0) {
    const currentCredits = await getUserCredits(userId);
    if (currentCredits < amount) {
      return { success: false, remaining: currentCredits };
    }
  }

  await db.insert(usageLogs).values({
    userId,
    action,
    creditsUsed: amount,
    metadata: metadata ?? null,
  });

  return { success: true, remaining };
}

export async function addCredits(
  userId: number,
  amount: number,
  stripeSessionId?: string
): Promise<number> {
  const result = await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${amount}`,
    })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits });

  return result[0]?.credits ?? 0;
}

export async function checkCredits(
  userId: number,
  required: number
): Promise<boolean> {
  const current = await getUserCredits(userId);
  return current >= required;
}
