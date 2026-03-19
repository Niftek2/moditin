import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'manager' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { pendingAssignmentId, districtId } = await req.json();
    if (!pendingAssignmentId || !districtId) return Response.json({ error: 'Missing fields' }, { status: 400 });

    // Verify ownership
    if (user.role === 'manager') {
      const districts = await base44.asServiceRole.entities.District.filter({ id: districtId, managerEmail: user.email });
      if (districts.length === 0) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assignments = await base44.asServiceRole.entities.PendingTeacherAssignment.filter({ id: pendingAssignmentId });
    if (assignments.length === 0) return Response.json({ error: 'Assignment not found' }, { status: 404 });
    const assignment = assignments[0];

    const teacherEmail = assignment.teacherEmail;
    const displayName = assignment.teacherName || 'Teacher';
    const districtName = assignment.districtName || 'your district';
    const tempPassword = assignment.tempPassword;
    const loginUrl = 'https://modaleducation.com/app';

    const passwordDisplay = tempPassword
      ? `<div style="margin-top:8px;display:block;background:#ffffff;border:2px solid #d8b4fe;border-radius:8px;padding:10px 18px;font-size:20px;font-weight:700;font-family:monospace;letter-spacing:3px;color:#400070;">${tempPassword}</div>`
      : `<div style="margin-top:8px;display:block;background:#fff8e1;border:2px solid #f59e0b;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;color:#92400e;">Your temporary password was in your original welcome email. If you can't find it, please reply to this email and we'll reset it for you.</div>`;

    const emailBody = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @media (prefers-color-scheme: dark) {
    .email-body { background-color: #1a0030 !important; }
    .email-card { background-color: #1e1e2e !important; }
    .body-text { color: #e8e0f0 !important; }
    .muted-text { color: #b0a0c0 !important; }
    .steps-box { background-color: #2a1a3e !important; }
    .steps-label { color: #c084fc !important; }
    .step-text { color: #e8e0f0 !important; }
    .password-box { background-color: #2a1a3e !important; border-color: #a855f7 !important; color: #f0e6ff !important; }
    .footer-bar { background-color: #150025 !important; }
    .footer-text { color: #9ca3af !important; }
  }
</style>
</head>
<body class="email-body" style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#400070 0%,#6B21A8 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Modal Education</p>
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Reminder: Your account is ready</h1>
            <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${districtName} has set you up on Modal Itinerant</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px;font-size:16px;color:#1a0028;line-height:1.6;">Hi ${displayName},</p>
            <p style="margin:0 0 28px;font-size:15px;color:#3d3d3d;line-height:1.7;">Just a reminder — your Modal Itinerant account is ready and waiting! Your license is <strong style="color:#400070;">already active</strong>. Here's how to get in:</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ff;border-radius:10px;padding:24px 28px;margin-bottom:28px;">
              <tr><td>
                <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:1px;color:#400070;text-transform:uppercase;">How to log in</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">1</div></td>
                    <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Go to <a href="${loginUrl}" style="color:#400070;font-weight:600;text-decoration:underline;">${loginUrl}</a></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">2</div></td>
                    <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Click <strong>"Sign In"</strong></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">3</div></td>
                    <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Enter your email: <strong style="color:#400070;">${teacherEmail}</strong></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">4</div></td>
                    <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">
                      Enter your temporary password:
                      <div style="margin-top:8px;display:inline-block;background:#ffffff;border:2px solid #d8b4fe;border-radius:8px;padding:10px 18px;font-size:18px;font-weight:700;font-family:monospace;letter-spacing:2px;color:#400070;">${tempPassword}</div>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="width:32px;padding-right:12px;"><div style="width:28px;height:28px;border-radius:50%;background:#400070;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff;">5</div></td>
                    <td valign="middle" style="font-size:15px;color:#1a0028;line-height:1.5;padding-top:4px;">Once you're in, go to <strong>Settings</strong> and set a new password.</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">Log In to Modal Itinerant →</a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Having trouble? Just reply to this email and we'll help you out.</p>
          </td>
        </tr>

        <tr>
          <td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 Modal Education, LLC · <a href="https://modaleducation.com" style="color:#400070;text-decoration:none;">modaleducation.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: teacherEmail,
      subject: `Reminder: Your Modal Itinerant account is ready — here's how to log in`,
      body: emailBody,
    });

    console.log(`Resent invite to ${teacherEmail} (assignment ${pendingAssignmentId})`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('resendTeacherInvite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});