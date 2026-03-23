import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, studentId, studentInitials, details } = await req.json();

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    await base44.asServiceRole.entities.AccessLog.create({
      userId: user.id,
      userEmail: user.email,
      action: action || 'StudentViewed',
      studentId: studentId || null,
      studentInitials: studentInitials || null,
      ipAddress,
      timestamp: new Date().toISOString(),
      details: details || null,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('logStudentAccess error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});