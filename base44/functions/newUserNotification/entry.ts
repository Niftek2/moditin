import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Helper: get approximate location from IP
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

// Triggered by entity automation on User create.
// Sends an admin notification email with the new user's details.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const newUser = body.data;

    if (!newUser?.email) {
      return Response.json({ skipped: true, reason: 'no email' });
    }

    // Get location from IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null;
    const location = await getLocationFromIP(ip);

    // Try to find their state from District (if manager) or TeacherProfile
    let stateInfo = '(not provided)';
    try {
      const districts = await base44.asServiceRole.entities.District.filter({ managerEmail: newUser.email });
      if (districts.length > 0 && districts[0].institutionState) {
        stateInfo = districts[0].institutionState;
      }
    } catch (e) {
      console.log('Could not fetch district state:', e.message);
    }

    const signupTime = new Date(newUser.created_date || Date.now()).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'nadiajiftekhar@gmail.com',
      subject: `👋 New User Signed Up: ${newUser.email}`,
      body: `<div style="font-family:Arial,sans-serif;color:#1a1028;background:#fff;padding:24px;max-width:600px">
<h2 style="color:#400070;margin-top:0;">New User Sign Up</h2>
<table style="width:100%;border-collapse:collapse;font-size:15px">
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070;width:160px">Name</td><td style="padding:8px 0">${newUser.full_name || '(not provided)'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Email</td><td style="padding:8px 0">${newUser.email}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">State</td><td style="padding:8px 0">${stateInfo}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Location (IP)</td><td style="padding:8px 0">${location || '(unavailable)'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Role</td><td style="padding:8px 0">${newUser.role || 'user'}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold;color:#400070">Signed Up</td><td style="padding:8px 0">${signupTime} CT</td></tr>
</table>
</div>`,
    });

    console.log(`New user notification sent for: ${newUser.email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('newUserNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});