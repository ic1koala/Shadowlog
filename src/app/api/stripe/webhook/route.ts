import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/stripe-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripeServer();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const bodyText = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
    } else {
      // In development or if webhook secret is not configured, parse payload directly with warning
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET is not configured or signature missing. Parsing unverified payload.");
      event = JSON.parse(bodyText) as Stripe.Event;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Stripe Webhook signature verification failed:", errorMsg);
    return NextResponse.json({ error: `Webhook Error: ${errorMsg}` }, { status: 400 });
  }

  const adminDb = getSupabaseAdmin();

  try {
    switch (event.type) {
      // ─────────────────────────────────────────────
      // 1. Checkout completed (User completed subscription checkout)
      // ─────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;
        const plan = (session.metadata?.plan as "base" | "pro") || "pro";
        let targetUserId = session.metadata?.userId || session.client_reference_id || null;

        // Fallback: If userId is not in metadata, search user by email
        if (!targetUserId) {
          const email = session.customer_details?.email || session.customer_email;
          if (email) {
            const { data: userProfile } = await adminDb
              .from("profiles")
              .select("id")
              .ilike("email", email)
              .maybeSingle();

            if (userProfile?.id) {
              targetUserId = userProfile.id;
            }
          }
        }

        if (targetUserId) {
          const { error: updateError } = await adminDb
            .from("profiles")
            .update({
              plan,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", targetUserId);

          if (updateError) {
            console.error(`❌ Failed to update profile for user ${targetUserId}:`, updateError);
          } else {
            console.log(`✅ User ${targetUserId} upgraded to ${plan} via Checkout session ${session.id}`);
          }
        } else {
          console.warn(`⚠️ checkout.session.completed received, but could not identify user for customer ${customerId}`);
        }
        break;
      }

      // ─────────────────────────────────────────────
      // 2. Subscription updated (Plan changes, renewals, failed status)
      // ─────────────────────────────────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const plan = (subscription.metadata?.plan as "base" | "pro") || "pro";

        const isGoodStanding = status === "active" || status === "trialing";
        const newPlan = isGoodStanding ? plan : "free";

        const { data: existingProfile, error: findError } = await adminDb
          .from("profiles")
          .select("id, email")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (findError) {
          console.warn(`Failed to find profile for stripe customer ${customerId}:`, findError);
        }

        if (existingProfile?.id) {
          const { error: updateError } = await adminDb
            .from("profiles")
            .update({
              plan: newPlan,
              stripe_subscription_id: isGoodStanding ? subscription.id : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProfile.id);

          if (updateError) {
            console.error(`❌ Failed to update profile status for ${existingProfile.id}:`, updateError);
          } else {
            console.log(`✅ Subscription updated for user ${existingProfile.id}: status=${status}, plan=${newPlan}`);
          }
        }
        break;
      }

      // ─────────────────────────────────────────────
      // 3. Subscription deleted / canceled
      // ─────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: existingProfile } = await adminDb
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (existingProfile?.id) {
          const { error: cancelError } = await adminDb
            .from("profiles")
            .update({
              plan: "free",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProfile.id);

          if (cancelError) {
            console.error(`❌ Failed to downgrade profile on subscription deletion for ${existingProfile.id}:`, cancelError);
          } else {
            console.log(`✅ Subscription canceled. User ${existingProfile.id} downgraded to free.`);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        console.log(`ℹ️ Invoice payment succeeded: ${(event.data.object as Stripe.Invoice).id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`⚠️ Invoice payment failed: ${invoice.id} for customer ${invoice.customer}`);
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("❌ Error handling Stripe webhook event:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
