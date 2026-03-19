import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Called by an entity automation when a new User is created.
// Checks if there's a pending district assignment for their email and auto-applies it.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const newUser = body.data;
    if (!newUser?.email) {
      return Response.json({ skipped: true, reason: 'no email' });
    }

    const pending = await base44.asServiceRole.entities.PendingTeacherAssignment.filter({
      teacherEmail: newUser.email,
      status: 'pending',
    });

    if (pending.length === 0) {
      return Response.json({ skipped: true, reason: 'no pending assignments' });
    }

    const assignment = pending[0]; // Apply the first pending assignment
    const districts = await base44.asServiceRole.entities.District.filter({ id: assignment.districtId });
    if (districts.length === 0) {
      await base44.asServiceRole.entities.PendingTeacherAssignment.update(assignment.id, { status: 'failed' });
      return Response.json({ error: 'District not found' });
    }
    const district = districts[0];

    // Activate the teacher
    await base44.asServiceRole.entities.User.update(newUser.id, {
      districtId: assignment.districtId,
      districtStatus: 'active',
      role: 'user',
    });

    // Mark assignment applied
    await base44.asServiceRole.entities.PendingTeacherAssignment.update(assignment.id, { status: 'applied' });

    // Send welcome email
    const displayName = assignment.teacherName || newUser.full_name || 'Colleague';
    const districtName = district.districtName || 'your district';
    const loginUrl = 'https://itinerant.modaleducation.com';

    const emailBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Modal Itinerant license is active</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#400070;padding:36px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#d4b8f0;text-transform:uppercase;">Modal Education</p>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">Your license is active! 🎉</h1>
            <p style="margin:0;font-size:16px;color:#e0d0f5;line-height:1.5;">${districtName} has set you up on Modal Itinerant</p>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding:32px 40px 8px;">
            <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1a0028;">Hi ${displayName},</p>
            <p style="margin:0;font-size:15px;color:#3d3d3d;line-height:1.7;">Your district has activated a full <strong style="color:#400070;">Modal Itinerant</strong> license for you. Follow the steps below to access your account right now.</p>
          </td>
        </tr>

        <!-- Steps -->
        <tr>
          <td style="padding:24px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:10px;padding:28px;border:1px solid #e4d9f5;">
              <tr><td>
                <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#400070;text-transform:uppercase;">How to get started — 3 easy steps</p>

                <!-- Step 1 -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr>
                    <td valign="top" style="width:40px;">
                      <div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;" aria-hidden="true">1</div>
                    </td>
                    <td valign="top" style="padding-top:6px;">
                      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">Open the app</p>
                      <p style="margin:0;font-size:14px;color:#3d3d3d;line-height:1.6;">Go to <a href="${loginUrl}" style="color:#400070;font-weight:700;text-decoration:underline;" aria-label="Open Modal Itinerant at ${loginUrl}">${loginUrl}</a> in your browser.</p>
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr><td style="border-top:1px solid #e4d9f5;"></td></tr>
                </table>

                <!-- Step 2 -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr>
                    <td valign="top" style="width:40px;">
                      <div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;" aria-hidden="true">2</div>
                    </td>
                    <td valign="top" style="padding-top:6px;">
                      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">Sign in with your email</p>
                      <p style="margin:0;font-size:14px;color:#3d3d3d;line-height:1.6;">Click <strong>"Sign In"</strong> and use this email address: <strong style="color:#400070;">${newUser.email}</strong>. Use the password you set when you created your account.</p>
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr><td style="border-top:1px solid #e4d9f5;"></td></tr>
                </table>

                <!-- Step 3 -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="width:40px;">
                      <div style="width:34px;height:34px;border-radius:50%;background:#400070;text-align:center;line-height:34px;font-size:15px;font-weight:700;color:#ffffff;" aria-hidden="true">3</div>
                    </td>
                    <td valign="top" style="padding-top:6px;">
                      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a0028;">You're in — your license is already applied</p>
                      <p style="margin:0;font-size:14px;color:#3d3d3d;line-height:1.6;">Once you sign in, your <strong>${districtName}</strong> district license will be active automatically. No extra steps needed.</p>
                    </td>
                  </tr>
                </table>

              </td></tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:8px 40px 32px;text-align:center;">
            <a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:17px;font-weight:700;text-decoration:none;padding:16px 44px;border-radius:8px;line-height:1.3;" aria-label="Open Modal Itinerant and sign in">Open Modal Itinerant →</a>
            <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Or copy this link into your browser:<br><span style="color:#400070;">${loginUrl}</span></p>
          </td>
        </tr>

        <!-- Help -->
        <tr>
          <td style="padding:0 40px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-radius:8px;padding:16px 20px;border-left:4px solid #f59e0b;">
              <tr>
                <td>
                  <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;"><strong>Need help?</strong> Just reply to this email and we'll get you sorted out right away. We're happy to help!</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
            <p style="margin:0;font-size:12px;color:#6b7280;">© 2026 Modal Education, LLC &nbsp;·&nbsp; <a href="https://modaleducation.com" style="color:#400070;text-decoration:underline;">modaleducation.com</a></p>
            <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">This email was sent because your district added you to Modal Itinerant.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: newUser.email,
      subject: `You're all set — your Modal Itinerant license is active`,
      body: emailBody,
    });

    console.log(`Applied pending assignment: ${newUser.email} → district ${assignment.districtId}`);
    return Response.json({ applied: true });
  } catch (error) {
    console.error('applyPendingAssignments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});