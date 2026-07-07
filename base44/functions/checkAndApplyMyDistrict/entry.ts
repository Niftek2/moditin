import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Called from the frontend after login if the user has no districtId yet.
// Checks for a pending assignment matching their email and applies it.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Manager self-heal: if this user is the purchaser of a district subscription,
    // make sure they have manager access and are linked to their district record
    const managedDistricts = await base44.asServiceRole.entities.District.filter({ managerEmail: user.email });
    if (managedDistricts.length > 0) {
      const md = managedDistricts[0];
      if (user.role !== 'manager' && user.role !== 'admin') {
        await base44.asServiceRole.entities.User.update(user.id, { role: 'manager' });
        console.log(`Self-heal: promoted ${user.email} to manager of district ${md.id}`);
      }
      if (!md.managerUserId) {
        await base44.asServiceRole.entities.District.update(md.id, { managerUserId: user.id });
      }
      return Response.json({ applied: true, isManager: true, districtId: md.id });
    }

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

    // Apply district to user (never downgrade managers/admins)
    const updates = { districtId: assignment.districtId, districtStatus: 'active' };
    if (user.role !== 'manager' && user.role !== 'admin') updates.role = 'user';
    await base44.asServiceRole.entities.User.update(user.id, updates);

    // Mark assignment applied
    await base44.asServiceRole.entities.PendingTeacherAssignment.update(assignment.id, { status: 'applied' });

    console.log(`Applied district ${assignment.districtId} to user ${user.email}`);
    return Response.json({ applied: true, districtId: assignment.districtId });
  } catch (error) {
    console.error('checkAndApplyMyDistrict error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});