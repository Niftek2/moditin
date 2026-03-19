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
    const displayName = teacherName || 'Teacher';
    const loginUrl = 'https://modaleducation.com/app';

    const tempPassword = generateTempPassword();

    // Check if user already exists
    const found = await base44.asServiceRole.entities.User.filter({ email: teacherEmail });

    if (found.length > 0) {
      // Existing user — update district info and temp password
      await base44.asServiceRole.entities.User.update(found[0].id, {
        districtId,
        districtStatus: 'active',
        tempPassword,
        role: 'user',
      });
    } else {
      // New user — invite them via the platform so they can log in
      await base44.users.inviteUser(teacherEmail, 'user');
      // Store a pending assignment so their district is applied when they first log in
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
        tempPassword,
      });
    }

    // Send a single, clear welcome email with step-by-step instructions
    const emailBody = [
      `Hi ${displayName},`,
      ``,
      `Great news — ${districtName} has set up a Modal Itinerant account for you!`,
      ``,
      `Modal Itinerant is the tool your district uses to manage student caseloads, IEP goals, service logs, and more.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `HOW TO LOG IN`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Step 1 — Go to this website:`,
      `${loginUrl}`,
      ``,
      `Step 2 — Click "Sign In"`,
      ``,
      `Step 3 — Enter your email address:`,
      `${teacherEmail}`,
      ``,
      `Step 4 — Enter your temporary password:`,
      `${tempPassword}`,
      ``,
      `Step 5 — Once you're in, go to Settings (top right corner) and choose a new password you'll remember.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Your district license is already active — you have full access right away.`,
      ``,
      `If you run into any trouble logging in, just reply to this email and we'll help you out.`,
      ``,
      `— The Modal Itinerant Team`,
    ].join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: teacherEmail,
      subject: `Your Modal Itinerant account is ready — here's how to log in`,
      body: emailBody,
    });

    console.log(`Assigned ${teacherEmail} to district ${districtId} (existing: ${found.length > 0})`);
    return Response.json({ success: true, emailSent: true, isNewUser: found.length === 0 });
  } catch (error) {
    console.error('assignTeacherToDistrict error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});