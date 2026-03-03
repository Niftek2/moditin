import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    // Note: this endpoint is public (no auth required) — purchaser may not be a user yet
    const {
      priceId,
      quantity,
      teacherEmails,
      purchaserEmail,
      purchaserName,
      planName,
      trialDays,
      currency,
      successUrl,
      cancelUrl,
    } = await req.json();

    if (!priceId || !purchaserEmail || !planName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`District checkout: ${planName} | ${quantity} seats | purchaser: ${purchaserEmail}`);

    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({ email: purchaserEmail, limit: 1 });
    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: purchaserEmail,
        name: purchaserName,
      });
      customerId = customer.id;
    }

    // Store teacher emails as metadata (stringify array)
    const teacherEmailsStr = JSON.stringify(teacherEmails || []);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: quantity || 1 }],
      subscription_data: {
        trial_period_days: trialDays || 14,
        metadata: {
          plan_name: planName,
          teacher_emails: teacherEmailsStr,
          purchaser_email: purchaserEmail,
          purchaser_name: purchaserName,
          quantity: String(quantity || 1),
          currency,
          trial_days: String(trialDays || 14),
          base44_app_id: Deno.env.get("BASE44_APP_ID"),
        },
      },
      success_url: successUrl || 'https://app.base44.com',
      cancel_url: cancelUrl || 'https://app.base44.com',
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        plan_name: planName,
        purchaser_email: purchaserEmail,
        teacher_emails: teacherEmailsStr,
        quantity: String(quantity || 1),
        trial_days: String(trialDays || 14),
      },
    });

    console.log(`Checkout session created: ${session.id}`);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('District checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});