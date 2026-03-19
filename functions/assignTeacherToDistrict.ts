import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'manager' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teacherEmail, teacherName, districtId } = await req.json();
    if (!teacherEmail || !districtId) return Response.json({ error: 'Missing fields' }, { status: 400 });

    // Verify this manager owns this district
    const districts = await base44.asServiceRole.entities.District.filter({ id: districtId });
    if (districts.length === 0) return Response.json({ error: 'District not found' }, { status: 404 });
    if (user.role === 'manager' && districts[0].managerEmail !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const district = districts[0];
    const districtName = district.districtName || 'your district';
    const displayName = teacherName || 'Teacher';
    const loginUrl = 'https://itinerant.modaleducation.com';

    // Check if user already exists in the app
    const found = await base44.asServiceRole.entities.User.filter({ email: teacherEmail });
    const isExisting = found.length > 0;

    if (isExisting) {
      // Existing user — update district info directly
      await base44.asServiceRole.entities.User.update(found[0].id, {
        districtId,
        districtStatus: 'active',
        role: 'user',
      });
      console.log(`Updated existing user ${teacherEmail} with district ${districtId}`);

      const emailBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#400070;padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Modal Education</p>
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Your license is active!</h1>
            <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${districtName} has activated your Modal Itinerant license</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px;font-size:16px;color:#1a0028;line-height:1.6;">Hi ${displayName},</p>
            <p style="margin:0 0 28px;font-size:15px;color:#3d3d3d;line-height:1.7;">Your district has activated a full license to <strong style="color:#400070;">Modal Itinerant</strong> for you. Just log in with your existing credentials.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${loginUrl}" style="display:inline-block;background:#400070;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">Log In to Modal Itinerant →</a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Having trouble? Reply to this email and we'll help you out.</p>
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
        subject: `Your Modal Itinerant license is active — log in now`,
        body: emailBody,
      });
      console.log(`Sent welcome email to existing user ${teacherEmail}`);

    } else {
      // New user — create pending assignment so district is applied when they register
      const existingPending = await base44.asServiceRole.entities.PendingTeacherAssignment.filter({ teacherEmail, districtId, status: 'pending' });
      for (const ep of existingPending) {
        await base44.asServiceRole.entities.PendingTeacherAssignment.update(ep.id, { status: 'applied' });
      }
      await base44.asServiceRole.entities.PendingTeacherAssignment.create({
        teacherEmail,
        teacherName: displayName,
        districtId,
        districtName,
        status: 'pending',
      });
      console.log(`Created PendingTeacherAssignment for new user ${teacherEmail}`);

      // Invite the user via the platform (correct API — not asServiceRole)
      await base44.users.inviteUser(teacherEmail, 'user');
      console.log(`Sent platform invite to new user ${teacherEmail}`);
    }

    console.log(`assignTeacherToDistrict complete: ${teacherEmail} → district ${districtId} (existing: ${isExisting})`);
    return Response.json({ success: true, isNewUser: !isExisting });

  } catch (error) {
    console.error('assignTeacherToDistrict error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});