import Stripe from "stripe";
import { CREDIT_PACKS } from "@/lib/credits";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export async function createCheckoutSession(
  packId: string,
  userId: string,
  userEmail: string | null | undefined
) {
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error("Invalid credit pack");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: userEmail ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pack.price * 100,
          product_data: {
            name: `CodeCraft AI - ${pack.label} Pack`,
            description: `${pack.credits.toLocaleString()} credits for CodeCraft AI`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packId,
      credits: String(pack.credits),
    },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=1&credits=${pack.credits}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=1`,
  });

  return session;
}
