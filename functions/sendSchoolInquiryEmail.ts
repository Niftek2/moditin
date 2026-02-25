import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();
    
    if (!data) {
      return Response.json({ error: 'No inquiry data provided' }, { status: 400 });
    }

    const { name, email, schoolDistrict, estimatedUsers, notes } = data;

    const emailBody = `New School Inquiry for Modal Itinerant

School/District: ${schoolDistrict || 'Not provided'}
Contact Name: ${name || 'Not provided'}
Contact Email: ${email || 'Not provided'}
Estimated Users: ${estimatedUsers || 'Not provided'}

Notes:
${notes || 'No notes provided'}`;

    await base44.integrations.Core.SendEmail({
      to: 'contact@modalmath.com',
      subject: `School Inquiry Modal Itinerant - ${schoolDistrict || name}`,
      body: emailBody,
      from_name: 'Modal Itinerant'
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending school inquiry email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});