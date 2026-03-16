import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'manager' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { districtId } = await req.json();
    if (!districtId) return Response.json({ error: 'Missing districtId' }, { status: 400 });

    // Verify this manager owns this district
    if (user.role === 'manager') {
      const districts = await base44.asServiceRole.entities.District.filter({ id: districtId, managerEmail: user.email });
      if (districts.length === 0) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const teachers = await base44.asServiceRole.entities.User.filter({ districtId });
    return Response.json({ teachers });
  } catch (error) {
    console.error('getDistrictTeachers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});