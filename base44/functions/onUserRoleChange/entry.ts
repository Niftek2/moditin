import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { data, old_data } = payload;

    // Only act when role just became "manager"
    if (data?.role !== 'manager' || old_data?.role === 'manager') {
      return Response.json({ skipped: true });
    }

    const email = data?.email;
    const userId = data?.id;
    if (!email) {
      console.log('No email on user, skipping district creation');
      return Response.json({ skipped: true });
    }

    const base44 = createClientFromRequest(req);

    // Check if a District already exists for this manager
    const existing = await base44.asServiceRole.entities.District.filter({ managerEmail: email });
    if (existing.length > 0) {
      console.log(`District already exists for ${email}, skipping`);
      return Response.json({ skipped: true, reason: 'district_exists' });
    }

    // Create a default District record
    const district = await base44.asServiceRole.entities.District.create({
      districtName: `${data?.full_name || email}'s District`,
      managerEmail: email,
      managerUserId: userId || '',
      planName: 'District',
      licensedTeacherCount: 6,
      status: 'active',
    });

    console.log(`Auto-created District for new manager ${email}: ${district.id}`);
    return Response.json({ created: true, districtId: district.id });
  } catch (error) {
    console.error('onUserRoleChange error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});