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
    const loginUrl = 'https://itinerant.modaleducation.com';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: newUser.email,
      subject: `You're all set — ${districtName} license applied on Modal Itinerant`,
      body: `<div style="font-family:Arial,sans-serif;color:#1a1028;padding:24px;max-width:560px;">
<div style="background:linear-gradient(135deg,#400070,#6B21A8);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
  <h1 style="color:#fff;margin:0;font-size:22px;">You're all set, ${displayName}!</h1>
</div>
<div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;">
  <p style="font-size:15px;color:#3d3d3d;line-height:1.7;">Your account has been linked to <strong style="color:#400070;">${districtName}</strong> and your license is active. You now have full access to Modal Itinerant.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${loginUrl}" style="background:#400070;color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;display:inline-block;">Open Modal Itinerant →</a>
  </div>
  <p style="font-size:13px;color:#9ca3af;text-align:center;">Having trouble? Reply to this email and we'll help.</p>
</div>
</div>`,
    });

    console.log(`Applied pending assignment: ${newUser.email} → district ${assignment.districtId}`);
    return Response.json({ applied: true });
  } catch (error) {
    console.error('applyPendingAssignments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});