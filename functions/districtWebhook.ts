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
        const loginUrl = 'https://itinerant.modaleducation.com';
        const teacherWelcomeHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#400070;padding:36px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#d4b8f0;text-transform:uppercase;">Modal Education</p>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">You've been invited! 🎉</h1>
            <p style="margin:0;font-size:16px;color:#e0d0f5;line-height:1.5;">${purchaserName} has given you access to Modal Itinerant</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 16px;">
            <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#1a0028;">Hi there,</p>
            <p style="margin:0;font-size:15px;color:#3d3d3d;line-height:1.7;">Great news — you've been added to Modal Itinerant as part of the <strong style="color:#400070;">${planName}</strong> plan. Your ${trialDays}-day free trial is now active and you won't be charged until ${trialEndStr}.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-radius:10px;padding:20px 24px;border-left:5px solid #f59e0b;">
              <tr><td>
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">⚠ Sign in using this exact email address:</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#400070;">${email}</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:10px;padding:28px;border:1px solid #e4d9f5;">
              <tr><td>
                <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#400070;text-transform:uppercase;">How to get started</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">1</div></td>
                    <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">Click the button below</p><p style="margin:0;font-size:14px;color:#3d3d3d;">It will take you to the Modal Itinerant website.</p></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="border-top:1px solid #e4d9f5;"></td></tr></table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">2</div></td>
                    <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">Click "Sign In" and enter your email</p><p style="margin:0;font-size:14px;color:#3d3d3d;">Use <strong style="color:#400070;">${email}</strong> — you'll receive a one-time login link (no password needed!).</p></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="border-top:1px solid #e4d9f5;"></td></tr></table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">3</div></td>
                    <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">You're in!</p><p style="margin:0;font-size:14px;color:#3d3d3d;">Your license will be applied automatically. No extra steps needed.</p></td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 40px 32px;text-align:center;">
            <a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;padding:18px 48px;border-radius:8px;">Get Started →</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-radius:8px;padding:16px 20px;border-left:4px solid #f59e0b;">
              <tr><td><p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;"><strong>Need help?</strong> Just reply to this email and we'll walk you through it.</p></td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
            <p style="margin:0;font-size:12px;color:#6b7280;">© 2026 Modal Education, LLC · <a href="https://modaleducation.com" style="color:#400070;text-decoration:none;">modaleducation.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `You've been invited to Modal Itinerant — ${planName} Plan`,
          body: teacherWelcomeHtml,
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
        const d = districts[0];
        await base44.asServiceRole.entities.District.update(d.id, { status: 'canceled' });
        console.log(`District ${d.id} marked as canceled`);
        // Admin cancellation notification
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'nadiajiftekhar@gmail.com',
            subject: `❌ Cancellation: ${d.data?.planName || 'District'} — ${d.data?.managerEmail || stripeCustomerId}`,
            body: `<div style="font-family:Arial,sans-serif;color:#1a1028;background:#fff;padding:24px;max-width:600px">
<h2 style="color:#b91c1c">Subscription Canceled</h2>
<table style="width:100%;border-collapse:collapse;font-size:15px">
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070;width:160px">District ID</td><td style="padding:8px 0">${d.id}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">District Name</td><td style="padding:8px 0">${d.data?.districtName || '(unknown)'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Manager Email</td><td style="padding:8px 0">${d.data?.managerEmail || '(unknown)'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Plan</td><td style="padding:8px 0">${d.data?.planName || '(unknown)'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Seats</td><td style="padding:8px 0">${d.data?.licensedTeacherCount || '(unknown)'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Stripe Customer ID</td><td style="padding:8px 0">${stripeCustomerId}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Stripe Sub ID</td><td style="padding:8px 0">${sub.id}</td></tr>
</table>
</div>`,
          });
        } catch (e2) {
          console.error('Failed to send admin cancellation notification:', e2.message);
        }
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