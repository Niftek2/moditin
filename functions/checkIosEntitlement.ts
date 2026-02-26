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

    let isEntitled = false;

    // Check for active Stripe subscription
    try {
      const subscriptions = await stripe.subscriptions.list({
        limit: 100,
      });

      const userSubscription = subscriptions.data.find(sub => {
        return sub.metadata?.user_email === user.email || 
               sub.customer === user.email;
      });

      if (userSubscription && ['active', 'trialing'].includes(userSubscription.status)) {
        isEntitled = true;
      }
    } catch (stripeError) {
      console.error('Stripe subscription check error:', stripeError);
    }

    // Check for active Apple subscription
    if (!isEntitled && user.appleSubscription) {
      try {
        const expirationDate = new Date(user.appleSubscription.expirationDate);
        const now = new Date();
        if (expirationDate > now) {
          isEntitled = true;
        }
      } catch (appleError) {
        console.error('Apple subscription check error:', appleError);
      }
    }

    return Response.json({ isEntitled });
  } catch (error) {
    console.error('Error checking iOS entitlement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});