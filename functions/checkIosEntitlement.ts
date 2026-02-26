import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for active Stripe subscription
    let isEntitled = false;
    try {
      // List all subscriptions for this customer email
      const subscriptions = await stripe.subscriptions.list({
        limit: 100,
      });

      // Find subscription matching this user's email
      const userSubscription = subscriptions.data.find(sub => {
        return sub.metadata?.user_email === user.email || 
               sub.customer === user.email; // Fallback if customer ID is email
      });

      // Check if subscription is active (not canceled or incomplete)
      if (userSubscription && ['active', 'trialing'].includes(userSubscription.status)) {
        isEntitled = true;
      }
    } catch (stripeError) {
      console.error('Stripe subscription check error:', stripeError);
      // If Stripe check fails, assume not entitled (safe default)
    }

    return Response.json({ isEntitled });
  } catch (error) {
    console.error('Error checking iOS entitlement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});