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
    const loginUrl = 'https://run.base44.com/apps/6998a9f042c4eb98ea121183/Join';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: newUser.email,
      subject: `Welcome to ${districtName} on Modal Itinerant!`,
      body: `Hi ${displayName},\n\nYour account is now active and linked to ${districtName} on Modal Itinerant. Sign in here: ${loginUrl}\n\n—\nThe Modal Itinerant Team`.trim(),
    });

    console.log(`Applied pending assignment: ${newUser.email} → district ${assignment.districtId}`);
    return Response.json({ applied: true });
  } catch (error) {
    console.error('applyPendingAssignments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});