import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { agreedAt, version } = await req.json();
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Write to User's termsAgreement field as a structured record
    await base44.asServiceRole.entities.AccessLog.create({
      userId: user.id,
      userEmail: user.email,
      action: 'TermsAgreed',
      ipAddress,
      timestamp: agreedAt || new Date().toISOString(),
      details: `Terms version: ${version || 'v1'}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('logTermsAgreement error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});