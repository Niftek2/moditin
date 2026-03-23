import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { managerEmail, licensedTeacherCount } = await req.json();

    if (!managerEmail || typeof licensedTeacherCount !== 'number' || licensedTeacherCount < 1) {
      return Response.json({ error: 'managerEmail and a valid licensedTeacherCount (>= 1) are required.' }, { status: 400 });
    }

    const districts = await base44.asServiceRole.entities.District.filter({ managerEmail });

    if (!districts || districts.length === 0) {
      return Response.json({ error: `No district found for manager email: ${managerEmail}` }, { status: 404 });
    }

    const district = districts[0];
    await base44.asServiceRole.entities.District.update(district.id, { licensedTeacherCount });

    console.log(`Updated licensedTeacherCount for ${managerEmail} to ${licensedTeacherCount}`);

    return Response.json({
      success: true,
      districtId: district.id,
      managerEmail,
      licensedTeacherCount,
    });
  } catch (error) {
    console.error('updateDistrictLicensedTeachers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});