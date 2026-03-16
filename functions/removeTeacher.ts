import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'manager' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teacherId, districtId } = await req.json();
    if (!teacherId || !districtId) return Response.json({ error: 'Missing fields' }, { status: 400 });

    // Verify manager owns this district
    if (user.role === 'manager') {
      const districts = await base44.asServiceRole.entities.District.filter({ id: districtId, managerEmail: user.email });
      if (districts.length === 0) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await base44.asServiceRole.entities.User.update(teacherId, {
      districtStatus: 'pending_deletion',
      scheduledDeletionDate: deletionDate.toISOString(),
    });

    console.log(`Marked teacher ${teacherId} for deletion in district ${districtId}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('removeTeacher error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});