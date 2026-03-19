import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    const teacherEmails = JSON.parse(metadata.teacher_emails || '[]');
    const purchaserEmail = metadata.purchaser_email || '';
    const purchaserName = metadata.purchaser_name || '';
    const institutionName = metadata.institution_name || '';
    const institutionState = metadata.institution_state || '';
    const planName = metadata.plan_name || 'Modal Itinerant';
    const trialDays = parseInt(metadata.trial_days || '14');
    const quantity = parseInt(metadata.quantity || '1');

    const stripeSubscriptionId = session.subscription;
    const stripeCustomerId = session.customer;

    console.log(`Checkout completed for ${planName}: ${quantity} seats, purchaser: ${purchaserEmail}`);

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    const trialEndStr = trialEndDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // --- District setup ---
    let districtId = null;
    if (quantity >= 1 && purchaserEmail && planName !== 'Modal Itinerant') {
      try {
        // Check if district already exists for this customer (upgrade flow)
        const existingDistricts = await base44.asServiceRole.entities.District.filter({ stripeCustomerId });

        if (existingDistricts.length > 0) {
          // Upgrade: update existing district record
          const existing = existingDistricts[0];
          districtId = existing.id;

          // Cancel old subscription if it changed
          if (existing.stripeSubscriptionId && existing.stripeSubscriptionId !== stripeSubscriptionId) {
            try {
              await stripe.subscriptions.cancel(existing.stripeSubscriptionId);
              console.log(`Canceled old subscription: ${existing.stripeSubscriptionId}`);
            } catch (e) {
              console.error('Failed to cancel old subscription:', e.message);
            }
          }

          await base44.asServiceRole.entities.District.update(districtId, {
            planName,
            licensedTeacherCount: quantity,
            stripeSubscriptionId,
            status: 'trialing',
            trialEndDate: trialEndDate.toISOString(),
          });
          console.log(`District upgraded: ${districtId}`);
        } else {
          // New district: promote purchaser and create record
          const purchaserUsers = await base44.asServiceRole.entities.User.filter({ email: purchaserEmail });
          let purchaserUserId = null;
          if (purchaserUsers.length > 0) {
            purchaserUserId = purchaserUsers[0].id;
            await base44.asServiceRole.auth.updateUser(purchaserUserId, { role: 'manager' });
            console.log(`Promoted ${purchaserEmail} to manager`);
          } else {
            await base44.asServiceRole.users.inviteUser(purchaserEmail, 'manager');
            console.log(`Invited purchaser ${purchaserEmail} as manager`);
            const newPurchasers = await base44.asServiceRole.entities.User.filter({ email: purchaserEmail });
            if (newPurchasers.length > 0) purchaserUserId = newPurchasers[0].id;
          }

          const districtRecord = await base44.asServiceRole.entities.District.create({
            districtName: institutionName || `${purchaserName}'s District`,
            institutionState,
            managerUserId: purchaserUserId || '',
            managerEmail: purchaserEmail,
            planName,
            licensedTeacherCount: quantity,
            stripeSubscriptionId,
            stripeCustomerId,
            status: 'trialing',
            trialEndDate: trialEndDate.toISOString(),
          });
          districtId = districtRecord.id;
          console.log(`District created: ${districtId}`);
        }
      } catch (e) {
        console.error('Failed to setup District record:', e.message);
      }
    }

    // Invite each teacher (skip purchaser — they're the manager)
    for (const email of teacherEmails) {
      if (!email || email === purchaserEmail) continue;
      try {
        await base44.asServiceRole.users.inviteUser(email, "user");
        console.log(`Invited teacher: ${email}`);
        if (districtId) {
          await new Promise(r => setTimeout(r, 500));
          const newUsers = await base44.asServiceRole.entities.User.filter({ email });
          if (newUsers.length > 0) {
            await base44.asServiceRole.entities.User.update(newUsers[0].id, {
              districtId,
              districtStatus: 'active',
            });
          }
        }
      } catch (e) {
        console.error(`Failed to invite ${email}:`, e.message);
      }

      // Welcome email to teacher
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `Welcome to Modal Itinerant — Your ${planName} Access is Ready`,
          body: `Hi there,\n\nYou've been invited to Modal Itinerant as part of the ${planName} plan by ${purchaserName} (${purchaserEmail}).\n\nYour ${trialDays}-day free trial is now active — you won't be charged until ${trialEndStr}.\n\nTo get started:\n1. Visit https://app.base44.com and click "Sign In"\n2. Use the email address this was sent to: ${email}\n3. Click "Forgot Password" to set up your password\n\nIf you have any questions, visit https://www.modaleducation.com/contact-5\n\nWelcome aboard!\nThe Modal Education Team`,
        });
      } catch (e) {
        console.error(`Failed to send welcome email to ${email}:`, e.message);
      }
    }

    // If individual plan, invite purchaser as user too
    if (quantity === 1 && teacherEmails.includes(purchaserEmail)) {
      try {
        await base44.asServiceRole.users.inviteUser(purchaserEmail, "user");
      } catch (e) {
        console.error(`Failed to invite purchaser as user: ${e.message}`);
      }
    }

    // Confirmation email to purchaser
    try {
      const teacherList = teacherEmails.filter(e => e && e !== purchaserEmail)
        .map((e, i) => `${i + 1}. ${e}`).join('\n');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: purchaserEmail,
        subject: `Your Modal Itinerant ${planName} Trial Has Started!`,
        body: `Hi ${purchaserName},\n\nThank you for choosing Modal Itinerant! Your ${trialDays}-day free trial for the ${planName} plan is now active.\n\nPlan: ${planName}\nSeats: ${quantity}\nTrial ends: ${trialEndStr}\n\n${teacherList ? `Teachers invited:\n${teacherList}\n\n` : ''}To access your account:\n1. Visit https://app.base44.com\n2. Sign in with ${purchaserEmail}\n\nQuestions? Visit https://www.modaleducation.com/contact-5\n\nThank you!\nThe Modal Education Team`,
      });
    } catch (e) {
      console.error('Failed to send confirmation to purchaser:', e.message);
    }

    // Admin notification email on new signup
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'nadiajiftekhar@gmail.com',
        subject: `🎉 New Signup: ${planName} — ${purchaserEmail}`,
        body: `<div style="font-family:Arial,sans-serif;color:#1a1028;background:#fff;padding:24px;max-width:600px">
<h2 style="color:#400070">New District Signup</h2>
<table style="width:100%;border-collapse:collapse;font-size:15px">
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070;width:160px">Plan</td><td style="padding:8px 0">${planName}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Seats</td><td style="padding:8px 0">${quantity}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Purchaser</td><td style="padding:8px 0">${purchaserName} &lt;${purchaserEmail}&gt;</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Institution</td><td style="padding:8px 0">${institutionName || '(not provided)'}, ${institutionState || ''}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Trial Ends</td><td style="padding:8px 0">${trialEndStr}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">District ID</td><td style="padding:8px 0">${districtId || 'N/A'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Stripe Sub ID</td><td style="padding:8px 0">${stripeSubscriptionId || 'N/A'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Teachers Invited</td><td style="padding:8px 0">${teacherEmails.filter(e => e && e !== purchaserEmail).join(', ') || '(none beyond purchaser)'}</td></tr>
</table>
</div>`,
      });
    } catch (e) {
      console.error('Failed to send admin signup notification:', e.message);
    }

    // Trial-ending reminder notification (2 days before)
    const reminderDate = new Date(trialEndDate);
    reminderDate.setDate(reminderDate.getDate() - 2);
    for (const email of [...new Set([...teacherEmails, purchaserEmail])]) {
      if (!email) continue;
      try {
        await base44.asServiceRole.entities.AppNotification.create({
          type: "CustomReminder",
          title: "Your free trial ends in 2 days",
          body: `Your ${planName} free trial ends on ${trialEndStr}. Your card will be charged at that time.`,
          triggerDateTime: reminderDate.toISOString(),
          isRead: false,
          ownerEmail: email,
        });
      } catch (e) {
        console.error(`Failed to create reminder for ${email}:`, e.message);
      }
    }
  }

  // Sync district status on subscription changes
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const stripeCustomerId = sub.customer;
    try {
      const districts = await base44.asServiceRole.entities.District.filter({ stripeCustomerId });
      if (districts.length > 0) {
        const status = ['active', 'trialing', 'past_due', 'canceled'].includes(sub.status) ? sub.status : 'active';
        await base44.asServiceRole.entities.District.update(districts[0].id, { status });
        console.log(`District ${districts[0].id} status updated to: ${status}`);
      }
    } catch (e) {
      console.error('Failed to update district on subscription update:', e.message);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const stripeCustomerId = sub.customer;
    try {
      const districts = await base44.asServiceRole.entities.District.filter({ stripeCustomerId });
      if (districts.length > 0) {
        await base44.asServiceRole.entities.District.update(districts[0].id, { status: 'canceled' });
        console.log(`District ${districts[0].id} marked as canceled`);
      }
    } catch (e) {
      console.error('Failed to update district on subscription delete:', e.message);
    }
  }

  if (event.type === 'customer.subscription.trial_will_end') {
    const subscription = event.data.object;
    console.log(`Trial will end soon for customer: ${subscription.customer}`);
  }

  return Response.json({ received: true });
});