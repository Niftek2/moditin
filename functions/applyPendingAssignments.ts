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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#400070;padding:36px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#d4b8f0;text-transform:uppercase;">Modal Education</p>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">You're all set! 🎉</h1>
            <p style="margin:0;font-size:16px;color:#e0d0f5;line-height:1.5;">Your Modal Itinerant license from ${districtName} is ready</p>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding:32px 40px 16px;">
            <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#1a0028;">Hi ${displayName},</p>
            <p style="margin:0;font-size:15px;color:#3d3d3d;line-height:1.7;">Your account is ready to use! Just click the button below to sign in. It only takes a minute.</p>
          </td>
        </tr>

        <!-- Email callout -->
        <tr>
          <td style="padding:0 40px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-radius:10px;padding:20px 24px;border-left:5px solid #f59e0b;">
              <tr><td>
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">⚠ Sign in using this email address:</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#400070;">${newUser.email}</p>
                <p style="margin:8px 0 0;font-size:13px;color:#78350f;">This is the email your district used to set up your account. Make sure to use it when signing in.</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;padding:18px 48px;border-radius:8px;line-height:1.3;">Sign In to Modal Itinerant →</a>
            <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Or copy this into your browser:<br><span style="color:#400070;">${loginUrl}</span></p>
          </td>
        </tr>

        <!-- Help -->
        <tr>
          <td style="padding:0 40px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:8px;padding:16px 20px;border-left:4px solid #400070;">
              <tr><td>
                <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#400070;">Having trouble signing in?</p>
                <p style="margin:0;font-size:14px;color:#3d3d3d;line-height:1.6;">Just reply to this email and we'll walk you through it step by step. We're happy to help!</p>
              </td></tr>
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
      subject: `You're invited to Modal Itinerant — sign in with ${newUser.email}`,
      body: emailBody,
    });

    console.log(`Applied pending assignment: ${newUser.email} → district ${assignment.districtId}`);
    return Response.json({ applied: true });
  } catch (error) {
    console.error('applyPendingAssignments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});