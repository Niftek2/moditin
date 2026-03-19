import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Called from the frontend after login if the user has no districtId yet.
// Checks for a pending assignment matching their email and applies it.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Already has a district — nothing to do
    if (user.districtId) {
      return Response.json({ applied: false, reason: 'already has district' });
    }

    const pending = await base44.asServiceRole.entities.PendingTeacherAssignment.filter({
      teacherEmail: user.email,
      status: 'pending',
    });

    if (pending.length === 0) {
      return Response.json({ applied: false, reason: 'no pending assignments' });
    }

    const assignment = pending[0];
    const districts = await base44.asServiceRole.entities.District.filter({ id: assignment.districtId });
    if (districts.length === 0) {
      await base44.asServiceRole.entities.PendingTeacherAssignment.update(assignment.id, { status: 'failed' });
      return Response.json({ applied: false, reason: 'district not found' });
    }

    // Apply district to user
    await base44.asServiceRole.entities.User.update(user.id, {
      districtId: assignment.districtId,
      districtStatus: 'active',
      role: 'user',
    });

    // Mark assignment applied
    await base44.asServiceRole.entities.PendingTeacherAssignment.update(assignment.id, { status: 'applied' });

    console.log(`Applied district ${assignment.districtId} to user ${user.email}`);
    return Response.json({ applied: true, districtId: assignment.districtId });
  } catch (error) {
    console.error('checkAndApplyMyDistrict error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});