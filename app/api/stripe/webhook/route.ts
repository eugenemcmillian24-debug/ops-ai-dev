import { stripe } from "@/lib/stripe";
import { addCredits } from "@/lib/credits";
import { db, transactions } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, credits } = session.metadata ?? {};

    if (!userId || !credits) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const creditsAmount = parseInt(credits);
    const userIdInt = parseInt(userId);

    await addCredits(userIdInt, creditsAmount, session.id);

    await db.insert(transactions).values({
      userId: userIdInt,
      credits: creditsAmount,
      amountCents: session.amount_total ?? 0,
      stripeSessionId: session.id,
    });
  }

  return NextResponse.json({ received: true });
}
