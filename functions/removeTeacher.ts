import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

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

    // Get teacher details before deactivating (for the email)
    const teachers = await base44.asServiceRole.entities.User.filter({ id: teacherId });
    const teacher = teachers[0];

    // Immediately deactivate: clear districtId so the paywall kicks in right away
    await base44.asServiceRole.entities.User.update(teacherId, {
      districtId: '',
      districtStatus: 'removed',
      tempPassword: '',
    });

    // Send deactivation notice
    if (teacher?.email) {
      const districts = await base44.asServiceRole.entities.District.filter({ id: districtId });
      const districtName = districts[0]?.districtName || 'your district';

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: teacher.email,
        subject: 'Your Modal Itinerant access has been updated',
        body: `
Hi ${teacher.full_name || 'there'},

Your access to Modal Itinerant through ${districtName} has been removed by your district administrator.

If you believe this is an error, please contact your administrator.

If you'd like to continue using Modal Itinerant independently, you can subscribe at: https://run.base44.com/apps/6998a9f042c4eb98ea121183/DistrictPricing

—
The Modal Itinerant Team
        `.trim(),
      });
    }

    console.log(`Deactivated teacher ${teacherId} from district ${districtId}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('removeTeacher error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});