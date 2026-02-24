import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return Response.json({ status: 'none', isActive: false });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return Response.json({ status: 'none', isActive: false });
    }

    const sub = subscriptions.data[0];
    const isActive = sub.status === 'active' || sub.status === 'trialing';

    return Response.json({
      status: sub.status,
      isActive,
      isTrial: sub.status === 'trialing',
      trialEnd: sub.trial_end,
      currentPeriodEnd: sub.current_period_end,
    });
  } catch (error) {
    console.error('Stripe status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});