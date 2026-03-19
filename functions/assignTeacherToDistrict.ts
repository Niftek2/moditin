import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result.slice(0, 3) + '-' + result.slice(3, 6) + '-' + result.slice(6);
}

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
    const displayName = teacherName || 'Colleague';
    const loginUrl = 'https://run.base44.com/apps/6998a9f042c4eb98ea121183/Join';

    // Try to find an already-registered user
    const found = await base44.asServiceRole.entities.User.filter({ email: teacherEmail });

    if (found.length > 0) {
      // User already exists — assign directly
      const teacherUser = found[0];
      const tempPassword = generateTempPassword();

      await base44.asServiceRole.entities.User.update(teacherUser.id, {
        districtId,
        districtStatus: 'active',
        tempPassword,
        role: 'user',
      });

      // Clean up any pending assignment for this email+district
      const pending = await base44.asServiceRole.entities.PendingTeacherAssignment.filter({ teacherEmail, districtId });
      for (const p of pending) {
        await base44.asServiceRole.entities.PendingTeacherAssignment.update(p.id, { status: 'applied' });
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: teacherEmail,
        subject: `You've been added to ${districtName} on Modal Itinerant`,
        body: `Hi ${displayName},\n\nYour administrator at ${districtName} has added you to Modal Itinerant.\n\nYour account is active. Sign in here: ${loginUrl}\n\nTemporary password: ${tempPassword}\n\nAfter signing in, go to Settings → Change Password to update your password.\n\n—\nThe Modal Itinerant Team`.trim(),
      });

      console.log(`Directly assigned ${teacherEmail} to district ${districtId}`);
      return Response.json({ assigned: true, emailSent: true });
    }

    // User not yet registered — store a pending assignment and send platform invite
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

    // Send a branded welcome email explaining why they're getting an invite
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: teacherEmail,
      subject: `You've been invited to Modal Itinerant by ${districtName}`,
      body: `Hi ${displayName},\n\nYour administrator at ${districtName} has invited you to Modal Itinerant — a platform built for itinerant teachers of the Deaf and Hard of Hearing.\n\nYou'll receive a separate email momentarily with a link to set up your account and create your password.\n\nOnce you've signed in, your district license will be automatically applied and you'll have full access.\n\nIf you have any questions, contact your district administrator or reach us at support@modaleducation.com.\n\n—\nThe Modal Itinerant Team`.trim(),
    });

    console.log(`Created pending assignment for ${teacherEmail} to district ${districtId}`);
    return Response.json({ assigned: false, pending: true, emailSent: true });
  } catch (error) {
    console.error('assignTeacherToDistrict error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});