import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Sends a test version of every email template in the app to a specified address.
// Admin only.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { toEmail } = await req.json();
    if (!toEmail) return Response.json({ error: 'toEmail is required' }, { status: 400 });

    const loginUrl = 'https://itinerant.modaleducation.com';
    const sampleName = 'Jane Smith';
    const sampleEmail = toEmail;
    const sampleDistrict = 'Springfield Unified School District';
    const samplePlan = 'District';
    const trialEndStr = 'April 5, 2026';
    const trialDays = 14;
    const quantity = 5;
    const results = [];

    const send = async (subject, body) => {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: toEmail, subject, body });
      results.push(subject);
      console.log(`Sent: ${subject}`);
    };

    // ─────────────────────────────────────────────────────────────────────
    // 1. Teacher Welcome Email (new teacher invited via district checkout)
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] You've been invited to Modal Itinerant — ${samplePlan} Plan`,
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#400070;padding:36px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#d4b8f0;text-transform:uppercase;">Modal Education</p>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">You've been invited! 🎉</h1>
          <p style="margin:0;font-size:16px;color:#e0d0f5;line-height:1.5;">Admin User has given you access to Modal Itinerant</p>
        </td></tr>
        <tr><td style="padding:32px 40px 16px;">
          <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#1a0028;">Hi there,</p>
          <p style="margin:0;font-size:15px;color:#3d3d3d;line-height:1.7;">Great news — you've been added to Modal Itinerant as part of the <strong style="color:#400070;">${samplePlan}</strong> plan. Your ${trialDays}-day free trial is now active and you won't be charged until ${trialEndStr}.</p>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-radius:10px;padding:20px 24px;border-left:5px solid #f59e0b;">
            <tr><td>
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">⚠ Sign in using this exact email address:</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#400070;">${sampleEmail}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:10px;padding:28px;border:1px solid #e4d9f5;">
            <tr><td>
              <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#400070;text-transform:uppercase;">How to get started</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
                <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">1</div></td>
                <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">Click the button below</p><p style="margin:0;font-size:14px;color:#3d3d3d;">It will take you to the Modal Itinerant website.</p></td>
              </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="border-top:1px solid #e4d9f5;"></td></tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
                <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">2</div></td>
                <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">Click "Sign In" and enter your email</p><p style="margin:0;font-size:14px;color:#3d3d3d;">Use <strong style="color:#400070;">${sampleEmail}</strong> — you'll receive a one-time login link (no password needed!).</p></td>
              </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="border-top:1px solid #e4d9f5;"></td></tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">3</div></td>
                <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">You're in!</p><p style="margin:0;font-size:14px;color:#3d3d3d;">Your license will be applied automatically. No extra steps needed.</p></td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 40px 32px;text-align:center;">
          <a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;padding:18px 48px;border-radius:8px;">Get Started →</a>
        </td></tr>
        <tr><td style="padding:0 40px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-radius:8px;padding:16px 20px;border-left:4px solid #f59e0b;">
            <tr><td><p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;"><strong>Need help?</strong> Just reply to this email and we'll walk you through it.</p></td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
          <p style="margin:0;font-size:12px;color:#6b7280;">© 2026 Modal Education, LLC · <a href="https://modaleducation.com" style="color:#400070;text-decoration:none;">modaleducation.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 2. Purchaser Confirmation Email (trial started)
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] Your Modal Itinerant ${samplePlan} Trial Has Started!`,
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#400070;padding:36px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#d4b8f0;text-transform:uppercase;">Modal Education</p>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">Your trial has started! 🎉</h1>
          <p style="margin:0;font-size:16px;color:#e0d0f5;line-height:1.5;">Welcome to Modal Itinerant — ${samplePlan} Plan</p>
        </td></tr>
        <tr><td style="padding:32px 40px 24px;">
          <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#1a0028;">Hi ${sampleName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#3d3d3d;line-height:1.7;">Thank you for choosing Modal Itinerant! Your <strong style="color:#400070;">${trialDays}-day free trial</strong> for the <strong>${samplePlan}</strong> plan is now active.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:10px;padding:24px 28px;margin-bottom:24px;border:1px solid #e4d9f5;">
            <tr><td>
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#400070;text-transform:uppercase;">Subscription Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;color:#1a0028;">
                <tr><td style="padding:5px 0;font-weight:600;width:140px;">Plan</td><td style="padding:5px 0;">${samplePlan}</td></tr>
                <tr><td style="padding:5px 0;font-weight:600;">Seats</td><td style="padding:5px 0;">${quantity}</td></tr>
                <tr><td style="padding:5px 0;font-weight:600;">Trial Ends</td><td style="padding:5px 0;">${trialEndStr}</td></tr>
              </table>
              <p style="margin:16px 0 8px;font-size:13px;font-weight:700;letter-spacing:1px;color:#400070;text-transform:uppercase;">Teachers Invited</p>
              <ul style="margin:0;padding-left:20px;"><li style="padding:4px 0;color:#3d3d3d;">teacher1@district.org</li><li style="padding:4px 0;color:#3d3d3d;">teacher2@district.org</li></ul>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:5px solid #f59e0b;">
            <tr><td>
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">⚠ Sign in using this email address:</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#400070;">${sampleEmail}</p>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center"><a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;padding:18px 48px;border-radius:8px;">Access Modal Itinerant →</a></td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Questions? Reply to this email or visit <a href="https://www.modaleducation.com/contact-5" style="color:#400070;">modaleducation.com/contact-5</a></p>
        </td></tr>
        <tr><td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
          <p style="margin:0;font-size:12px;color:#6b7280;">© 2026 Modal Education, LLC · <a href="https://modaleducation.com" style="color:#400070;text-decoration:none;">modaleducation.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 3. Admin New Signup Notification
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] 🎉 New Signup: ${samplePlan} — ${sampleEmail}`,
      `<div style="font-family:Arial,sans-serif;color:#1a1028;background:#fff;padding:24px;max-width:600px">
<h2 style="color:#400070">New District Signup</h2>
<table style="width:100%;border-collapse:collapse;font-size:15px">
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070;width:160px">Plan</td><td style="padding:8px 0">${samplePlan}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Seats</td><td style="padding:8px 0">${quantity}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Purchaser</td><td style="padding:8px 0">${sampleName} &lt;${sampleEmail}&gt;</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Institution</td><td style="padding:8px 0">${sampleDistrict}, IL</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Trial Ends</td><td style="padding:8px 0">${trialEndStr}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">District ID</td><td style="padding:8px 0">dist_test_123</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Stripe Sub ID</td><td style="padding:8px 0">sub_test_abc</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Teachers Invited</td><td style="padding:8px 0">teacher1@district.org, teacher2@district.org</td></tr>
</table>
</div>`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 4. Admin Cancellation Notification
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] ❌ Cancellation: ${samplePlan} — ${sampleEmail}`,
      `<div style="font-family:Arial,sans-serif;color:#1a1028;background:#fff;padding:24px;max-width:600px">
<h2 style="color:#b91c1c">Subscription Canceled</h2>
<table style="width:100%;border-collapse:collapse;font-size:15px">
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070;width:160px">District ID</td><td style="padding:8px 0">dist_test_123</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">District Name</td><td style="padding:8px 0">${sampleDistrict}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Manager Email</td><td style="padding:8px 0">${sampleEmail}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Plan</td><td style="padding:8px 0">${samplePlan}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Seats</td><td style="padding:8px 0">${quantity}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Stripe Customer ID</td><td style="padding:8px 0">cus_test_xyz</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Stripe Sub ID</td><td style="padding:8px 0">sub_test_abc</td></tr>
</table>
</div>`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 5. Existing Teacher – License Active Email (assignTeacherToDistrict)
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] Your Modal Itinerant license is active — log in now`,
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#400070;padding:32px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Modal Education</p>
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Your license is active!</h1>
          <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${sampleDistrict} has activated your Modal Itinerant license</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:16px;color:#1a0028;line-height:1.6;">Hi ${sampleName},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#3d3d3d;line-height:1.7;">Your district has activated a full license to <strong style="color:#400070;">Modal Itinerant</strong> for you. Just log in with your existing credentials.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center"><a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">Log In to Modal Itinerant →</a></td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Having trouble? Reply to this email and we'll help you out.</p>
        </td></tr>
        <tr><td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 Modal Education, LLC · <a href="https://modaleducation.com" style="color:#400070;text-decoration:none;">modaleducation.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 6. New Teacher Invitation Email (assignTeacherToDistrict - new user)
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] You've been invited to Modal Itinerant by ${sampleDistrict}`,
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#400070;padding:36px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#d4b8f0;text-transform:uppercase;">Modal Education</p>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">You're invited! 🎉</h1>
          <p style="margin:0;font-size:16px;color:#e0d0f5;line-height:1.5;">${sampleDistrict} has given you access to Modal Itinerant</p>
        </td></tr>
        <tr><td style="padding:32px 40px 8px;">
          <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#1a0028;">Hi ${sampleName},</p>
          <p style="margin:0;font-size:15px;color:#3d3d3d;line-height:1.7;">Great news — your district has set up a <strong style="color:#400070;">Modal Itinerant</strong> account for you. Follow the simple steps below to get in.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-radius:10px;padding:20px 24px;border-left:5px solid #f59e0b;">
            <tr><td>
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">⚠ Important — use this exact email to sign in:</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#400070;">${sampleEmail}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:10px;padding:28px;border:1px solid #e4d9f5;">
            <tr><td>
              <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#400070;text-transform:uppercase;">How to get started — 3 easy steps</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
                <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">1</div></td>
                <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">Click the button below</p><p style="margin:0;font-size:14px;color:#3d3d3d;line-height:1.6;">It will take you directly to the Modal Itinerant website.</p></td>
              </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="border-top:1px solid #e4d9f5;"></td></tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
                <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">2</div></td>
                <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">Click "Sign In" and enter your email</p><p style="margin:0;font-size:14px;color:#3d3d3d;line-height:1.6;">Use <strong style="color:#400070;">${sampleEmail}</strong> — you'll receive a one-time login link (no password needed!).</p></td>
              </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="border-top:1px solid #e4d9f5;"></td></tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td valign="top" style="width:44px;"><div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;">3</div></td>
                <td valign="top" style="padding-top:6px;"><p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">You're in!</p><p style="margin:0;font-size:14px;color:#3d3d3d;line-height:1.6;">Your <strong>${sampleDistrict}</strong> license will be applied automatically. No extra steps needed.</p></td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 40px 32px;text-align:center;">
          <a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;padding:18px 48px;border-radius:8px;line-height:1.3;">Get Started →</a>
          <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Or copy this into your browser:<br><span style="color:#400070;">${loginUrl}</span></p>
        </td></tr>
        <tr><td style="padding:0 40px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-radius:8px;padding:16px 20px;border-left:4px solid #f59e0b;">
            <tr><td><p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;"><strong>Need help?</strong> Just reply to this email and we'll walk you through it. We're happy to help!</p></td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
          <p style="margin:0;font-size:12px;color:#6b7280;">© 2026 Modal Education, LLC &nbsp;·&nbsp; <a href="https://modaleducation.com" style="color:#400070;text-decoration:underline;">modaleducation.com</a></p>
          <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">This email was sent because your district added you to Modal Itinerant.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 7. Resend Invite – New User (hasn't signed up yet)
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] Reminder: Create your Modal Itinerant account`,
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#400070 0%,#6B21A8 100%);padding:32px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Modal Education</p>
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Reminder: Your account is waiting</h1>
          <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${sampleDistrict} has activated your license</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:16px;color:#1a0028;line-height:1.6;">Hi ${sampleName},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#3d3d3d;line-height:1.7;">Just a reminder — your <strong style="color:#400070;">Modal Itinerant</strong> license is active and ready. You haven't created your account yet. It only takes a minute:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:10px;padding:24px 28px;margin-bottom:28px;">
            <tr><td>
              <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:1px;color:#400070;text-transform:uppercase;">How to create your account</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
                <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">1</div></td>
                <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Go to <a href="${loginUrl}" style="color:#400070;font-weight:700;text-decoration:underline;">${loginUrl}</a></td>
              </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
                <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">2</div></td>
                <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Click <strong>"Sign Up"</strong> and create your account using this email address: <strong style="color:#400070;">${sampleEmail}</strong></td>
              </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">3</div></td>
                <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Once you create your account, your district license will be <strong>automatically applied</strong> — no extra steps needed.</td>
              </tr></table>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center"><a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">Create My Account →</a></td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Having trouble? Reply to this email and we'll help you out.</p>
        </td></tr>
        <tr><td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 Modal Education, LLC · <a href="https://modaleducation.com" style="color:#400070;text-decoration:none;">modaleducation.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 8. Resend Invite – Existing User (already has an account)
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] Reminder: Log in to Modal Itinerant`,
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#400070 0%,#6B21A8 100%);padding:32px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Modal Education</p>
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Reminder: Your account is waiting</h1>
          <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${sampleDistrict} has activated your license</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:16px;color:#1a0028;line-height:1.6;">Hi ${sampleName},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#3d3d3d;line-height:1.7;">Just a reminder — your <strong style="color:#400070;">Modal Itinerant</strong> license is active and ready. Your account already exists — just log in.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:10px;padding:24px 28px;margin-bottom:28px;">
            <tr><td>
              <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:1px;color:#400070;text-transform:uppercase;">How to log in</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
                <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">1</div></td>
                <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Go to <a href="${loginUrl}" style="color:#400070;font-weight:700;text-decoration:underline;">${loginUrl}</a></td>
              </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
                <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">2</div></td>
                <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Click <strong>"Sign In"</strong> and enter your email and password</td>
              </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">3</div></td>
                <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Your district license is already applied — you're all set!</td>
              </tr></table>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center"><a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">Log In to Modal Itinerant →</a></td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Having trouble? Reply to this email and we'll help you out.</p>
        </td></tr>
        <tr><td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 Modal Education, LLC · <a href="https://modaleducation.com" style="color:#400070;text-decoration:none;">modaleducation.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 9. Auto-Applied License Welcome (applyPendingAssignments)
    // ─────────────────────────────────────────────────────────────────────
    await send(
      `[TEST] You're invited to Modal Itinerant — sign in with ${sampleEmail}`,
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#400070;padding:36px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#d4b8f0;text-transform:uppercase;">Modal Education</p>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">You're all set! 🎉</h1>
          <p style="margin:0;font-size:16px;color:#e0d0f5;line-height:1.5;">Your Modal Itinerant license from ${sampleDistrict} is ready</p>
        </td></tr>
        <tr><td style="padding:32px 40px 16px;">
          <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#1a0028;">Hi ${sampleName},</p>
          <p style="margin:0;font-size:15px;color:#3d3d3d;line-height:1.7;">Your account is ready to use! Just click the button below to sign in. It only takes a minute.</p>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-radius:10px;padding:20px 24px;border-left:5px solid #f59e0b;">
            <tr><td>
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">⚠ Sign in using this email address:</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#400070;">${sampleEmail}</p>
              <p style="margin:8px 0 0;font-size:13px;color:#78350f;">This is the email your district used to set up your account. Make sure to use it when signing in.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;padding:18px 48px;border-radius:8px;line-height:1.3;">Sign In to Modal Itinerant →</a>
          <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Or copy this into your browser:<br><span style="color:#400070;">${loginUrl}</span></p>
        </td></tr>
        <tr><td style="padding:0 40px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:8px;padding:16px 20px;border-left:4px solid #400070;">
            <tr><td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#400070;">Having trouble signing in?</p>
              <p style="margin:0;font-size:14px;color:#3d3d3d;line-height:1.6;">Just reply to this email and we'll walk you through it step by step. We're happy to help!</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
          <p style="margin:0;font-size:12px;color:#6b7280;">© 2026 Modal Education, LLC &nbsp;·&nbsp; <a href="https://modaleducation.com" style="color:#400070;text-decoration:underline;">modaleducation.com</a></p>
          <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">This email was sent because your district added you to Modal Itinerant.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    );

    return Response.json({ success: true, sent: results.length, emails: results });
  } catch (error) {
    console.error('sendTestEmails error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});