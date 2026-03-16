import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'manager' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teacherEmail, districtId } = await req.json();
    if (!teacherEmail || !districtId) return Response.json({ error: 'Missing fields' }, { status: 400 });

    // Verify this manager owns this district
    if (user.role === 'manager') {
      const districts = await base44.asServiceRole.entities.District.filter({ id: districtId, managerEmail: user.email });
      if (districts.length === 0) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email: teacherEmail });
    if (users.length === 0) return Response.json({ assigned: false, message: 'User not found yet' });

    await base44.asServiceRole.entities.User.update(users[0].id, {
      districtId,
      districtStatus: 'active',
    });

    console.log(`Assigned ${teacherEmail} to district ${districtId}`);
    return Response.json({ assigned: true });
  } catch (error) {
    console.error('assignTeacherToDistrict error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});