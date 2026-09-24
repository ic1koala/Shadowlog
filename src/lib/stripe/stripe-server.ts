import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured in environment variables.");
  }

  stripeInstance = new Stripe(secretKey, {
    typescript: true,
  });

  return stripeInstance;
}
