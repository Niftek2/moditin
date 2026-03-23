import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Helper: get approximate location from IP using ip-api.com (free, no key needed)
async function getLocationFromIP(ip) {
  try {
    if (!ip || ip === '127.0.0.1' || ip.startsWith('::')) return null;
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,status`);
    const data = await res.json();
    if (data.status === 'success') {
      return `${data.city || ''}, ${data.regionName || ''}, ${data.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
    }
  } catch (e) {
    console.log('Geo lookup failed:', e.message);
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Extract IP from request headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null;

    const location = await getLocationFromIP(ip);

    // Send admin notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'nadiajiftekhar@gmail.com',
      subject: '🧪 New Demo Sign-Up — Modal Itinerant',
      body: `<div style="font-family:Arial,sans-serif;color:#1a1028;padding:24px;max-width:600px">
<h2 style="color:#400070;margin-top:0;">New Demo Sign-Up</h2>
<table style="width:100%;border-collapse:collapse;font-size:15px">
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070;width:160px">Email</td><td style="padding:8px 0">${email}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Location</td><td style="padding:8px 0">${location || '(unavailable)'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Time</td><td style="padding:8px 0">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT</td></tr>
</table>
</div>`,
    });

    console.log(`Demo signup notification sent for: ${email}, location: ${location}`);
    return Response.json({ success: true, location });
  } catch (error) {
    console.error('demoSignupNotify error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});