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
    const planName = metadata.plan_name || 'Modal Itinerant';
    const trialDays = parseInt(metadata.trial_days || '14');
    const quantity = parseInt(metadata.quantity || '1');

    const stripeSubscriptionId = session.subscription;
    const stripeCustomerId = session.customer;

    console.log(`Checkout completed for ${planName}: ${quantity} seats, purchaser: ${purchaserEmail}`);

    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    const trialEndStr = trialEndDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // --- District setup: create District record + promote purchaser to manager ---
    let districtId = null;
    if (quantity > 1) {
      try {
        // Find purchaser user and promote to manager
        const purchaserUsers = await base44.asServiceRole.entities.User.filter({ email: purchaserEmail });
        let purchaserUserId = null;
        if (purchaserUsers.length > 0) {
          purchaserUserId = purchaserUsers[0].id;
          await base44.asServiceRole.auth.updateUser(purchaserUserId, { role: 'manager' });
          console.log(`Promoted ${purchaserEmail} to manager role`);
        } else {
          // Invite purchaser as manager if they don't have an account yet
          await base44.asServiceRole.users.inviteUser(purchaserEmail, 'manager');
          console.log(`Invited purchaser ${purchaserEmail} as manager`);
          const newPurchasers = await base44.asServiceRole.entities.User.filter({ email: purchaserEmail });
          if (newPurchasers.length > 0) purchaserUserId = newPurchasers[0].id;
        }

        // Create District record
        const districtRecord = await base44.asServiceRole.entities.District.create({
          districtName: `${purchaserName}'s District`,
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
        console.log(`District record created: ${districtId}`);
      } catch (e) {
        console.error('Failed to create District record:', e.message);
      }
    }

    // Invite each teacher and send them a welcome email
    for (const email of teacherEmails) {
      if (!email || email === purchaserEmail) continue;
      try {
        await base44.asServiceRole.users.inviteUser(email, "user");
        console.log(`Invited teacher: ${email}`);
        // Link teacher to district
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

      // Send welcome email to teacher
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `Welcome to Modal Itinerant — Your ${planName} Access is Ready`,
          body: `
Hi there,

You've been invited to Modal Itinerant as part of the ${planName} plan by ${purchaserName} (${purchaserEmail}).

Your ${trialDays}-day free trial is now active — you won't be charged until ${trialEndStr}.

To get started:
1. Visit https://app.base44.com and click "Sign In"
2. Use the email address this was sent to: ${email}
3. Click "Forgot Password" to set up your password and access your account

You'll have full access to:
• AI-powered goal bank for Deaf/HH students
• Service log & scheduling calendar
• Listening checks (Ling 6) and audiology tools
• Interactive activities and worksheets
• And much more

If you have any questions, visit https://www.modaleducation.com/contact-5

Welcome aboard!
The Modal Education Team
          `.trim(),
        });
        console.log(`Welcome email sent to teacher: ${email}`);
      } catch (e) {
        console.error(`Failed to send welcome email to ${email}:`, e.message);
      }
    }

    // If individual plan, the purchaser IS the teacher — invite them too
    if (quantity === 1 && teacherEmails.includes(purchaserEmail)) {
      try {
        await base44.asServiceRole.users.inviteUser(purchaserEmail, "user");
      } catch (e) {
        console.error(`Failed to invite purchaser as user: ${e.message}`);
      }
    }

    // Send confirmation email to purchaser
    try {
      const teacherList = teacherEmails.filter(e => e && e !== purchaserEmail)
        .map((e, i) => `${i + 1}. ${e}`).join('\n');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: purchaserEmail,
        subject: `Your Modal Itinerant ${planName} Trial Has Started!`,
        body: `
Hi ${purchaserName},

Thank you for choosing Modal Itinerant! Your ${trialDays}-day free trial for the ${planName} plan is now active.

Trial details:
• Plan: ${planName}
• Seats: ${quantity}
• Trial ends: ${trialEndStr}
• You will NOT be charged until ${trialEndStr}

${teacherList ? `The following teachers have been invited and will receive login instructions by email:\n${teacherList}\n` : ''}
To access your account:
1. Visit https://app.base44.com
2. Sign in with ${purchaserEmail}
3. If it's your first time, click "Forgot Password" to set your password

You'll receive a reminder 2 days before your trial ends.

Questions? Visit https://www.modaleducation.com/contact-5

Thank you for supporting Deaf and Hard of Hearing students!
The Modal Education Team
        `.trim(),
      });
      console.log(`Confirmation email sent to purchaser: ${purchaserEmail}`);
    } catch (e) {
      console.error(`Failed to send confirmation to purchaser:`, e.message);
    }

    // Create in-app trial-ending reminders for 2 days before trial ends
    const reminderDate = new Date(trialEndDate);
    reminderDate.setDate(reminderDate.getDate() - 2);

    for (const email of [...new Set([...teacherEmails, purchaserEmail])]) {
      if (!email) continue;
      try {
        // Find the user by email
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users.length > 0) {
          await base44.asServiceRole.entities.AppNotification.create({
            type: "CustomReminder",
            title: "Your free trial ends in 2 days",
            body: `Your ${planName} free trial ends on ${trialEndStr}. Your card will be charged at that time. Manage your subscription at any time.`,
            triggerDateTime: reminderDate.toISOString(),
            isRead: false,
          });
          console.log(`Trial reminder notification created for ${email}`);
        }
      } catch (e) {
        console.error(`Failed to create reminder for ${email}:`, e.message);
      }
    }
  }

  if (event.type === 'customer.subscription.trial_will_end') {
    // Stripe fires this 3 days before trial end — we use it as a safety net
    const subscription = event.data.object;
    const customerEmail = subscription.metadata?.purchaser_email;
    console.log(`Trial will end soon for: ${customerEmail}`);
    // Notifications are already created at checkout — this is a backup log
  }

  return Response.json({ received: true });
});