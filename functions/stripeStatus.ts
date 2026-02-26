import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get student count for freemium limit (only this user's students)
    const students = await base44.entities.Student.filter({ created_by: user.email });
    const studentCount = students.length;

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return Response.json({ status: 'none', isActive: false, isPro: false, isTrial: false, studentCount });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return Response.json({ status: 'none', isActive: false, isPro: false, isTrial: false, studentCount });
    }

    const sub = subscriptions.data[0];
    const isActive = sub.status === 'active' || sub.status === 'trialing';
    const isTrial = sub.status === 'trialing';
    const isPro = sub.status === 'active';

    return Response.json({
      status: sub.status,
      isActive,
      isPro,
      isTrial,
      trialEnd: sub.trial_end,
      currentPeriodEnd: sub.current_period_end,
      studentCount,
    });
  } catch (error) {
    console.error('Stripe status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});