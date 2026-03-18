import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXX-XXX-XXXX for readability
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

    // Generate a temporary password for the teacher
    const tempPassword = generateTempPassword();

    // Retry finding the user — account creation from inviteUser can take a moment
    let teacherUser = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const found = await base44.asServiceRole.entities.User.filter({ email: teacherEmail });
      if (found.length > 0) {
        teacherUser = found[0];
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!teacherUser) {
      console.error(`User not found after retries: ${teacherEmail}`);
      return Response.json({ assigned: false, message: 'User account not found. Please try again in a moment.' }, { status: 404 });
    }

    // Activate the teacher in this district
    await base44.asServiceRole.entities.User.update(teacherUser.id, {
      districtId,
      districtStatus: 'active',
      tempPassword,
      role: 'user',
    });

    // Send a branded welcome email with their temp password
    const displayName = teacherName || teacherUser.full_name || 'Teacher';
    const districtName = district.districtName || 'your district';
    const loginUrl = 'https://run.base44.com/apps/6998a9f042c4eb98ea121183/Join';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: teacherEmail,
      subject: `You've been added to ${districtName} on Modal Itinerant`,
      body: `
Hi ${displayName},

Your administrator at ${districtName} has added you to Modal Itinerant — a clinical tool built for itinerant teachers of students who are Deaf or Hard of Hearing.

Your account is active and ready to use. Here are your sign-in details:

  Email: ${teacherEmail}
  Temporary Password: ${tempPassword}

Sign in here: ${loginUrl}

After signing in for the first time, go to Settings → Change Password to set a permanent password of your choice.

If you have any trouble signing in, click "Forgot Password" on the sign-in page or contact your district administrator.

—
The Modal Itinerant Team
      `.trim(),
    });

    console.log(`Assigned and emailed ${teacherEmail} to district ${districtId}`);
    return Response.json({ assigned: true, emailSent: true });
  } catch (error) {
    console.error('assignTeacherToDistrict error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});