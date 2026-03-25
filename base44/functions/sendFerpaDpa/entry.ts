import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const PDF_URL = "https://media.base44.com/files/public/6998a9f042c4eb98ea121183/7104cf2c7_modal-itinerant-ferpa-fillable.pdf";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { repName, title, institutionName, institutionAddress, institutionEmail, dateSigned } = await req.json();

    if (!repName || !title || !institutionName || !institutionEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const formattedDate = dateSigned || new Date().toISOString().split('T')[0];

    const summaryHtml = `
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
        <tr><td style="padding:8px;font-weight:bold;width:40%;color:#400070;">Authorized Representative</td><td style="padding:8px;">${repName}</td></tr>
        <tr style="background:#f7f3fa;"><td style="padding:8px;font-weight:bold;color:#400070;">Title / Role</td><td style="padding:8px;">${title}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#400070;">Institution Name</td><td style="padding:8px;">${institutionName}</td></tr>
        <tr style="background:#f7f3fa;"><td style="padding:8px;font-weight:bold;color:#400070;">Institution Address</td><td style="padding:8px;">${institutionAddress || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#400070;">Email for Notices</td><td style="padding:8px;">${institutionEmail}</td></tr>
        <tr style="background:#f7f3fa;"><td style="padding:8px;font-weight:bold;color:#400070;">Date Signed</td><td style="padding:8px;">${formattedDate}</td></tr>
      </table>
    `;

    const institutionBody = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#400070;padding:24px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">FERPA Compliance Notice & Data Processing Agreement</h1>
          <p style="color:#d4b8f0;margin:4px 0 0;font-size:13px;">Modal Education, LLC · Executed Copy</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #d8cde5;border-top:none;">
          <p style="color:#1a1028;font-size:14px;">Thank you for executing the FERPA Compliance Notice and Data Processing Agreement with Modal Education, LLC.</p>
          <p style="color:#1a1028;font-size:14px;">Below is a summary of the information submitted. Please retain this email for your records along with the signed PDF.</p>

          <h2 style="color:#400070;font-size:15px;margin-top:24px;">Execution Summary</h2>
          ${summaryHtml}

          <div style="margin-top:24px;padding:16px;background:#f7f3fa;border-left:4px solid #400070;border-radius:4px;">
            <p style="margin:0;font-size:13px;color:#4a4a4a;">
              <strong>The full agreement document is available here:</strong><br/>
              <a href="${PDF_URL}" style="color:#6b2fb9;">${PDF_URL}</a>
            </p>
          </div>

          <p style="margin-top:24px;font-size:13px;color:#4a4a4a;">
            This Agreement is effective as of the date signed above and remains in effect for the duration of your active subscription and data retention period (Section 7 of the Agreement).
          </p>
          <p style="font-size:13px;color:#4a4a4a;">
            Questions? Contact us at <a href="mailto:schools@modaleducation.com" style="color:#6b2fb9;">schools@modaleducation.com</a>
          </p>
        </div>
        <div style="background:#f7f3fa;padding:16px 32px;border:1px solid #d8cde5;border-top:none;border-radius:0 0 8px 8px;font-size:11px;color:#888;text-align:center;">
          Modal Education, LLC · This document does not constitute legal advice.
        </div>
      </div>
    `;

    const adminBody = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#400070;padding:24px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">New FERPA DPA Execution</h1>
          <p style="color:#d4b8f0;margin:4px 0 0;font-size:13px;">An institution has executed the FERPA DPA</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #d8cde5;border-top:none;">
          ${summaryHtml}
          <div style="margin-top:24px;padding:16px;background:#fff3cd;border-left:4px solid #f0a500;border-radius:4px;">
            <p style="margin:0;font-size:13px;color:#4a4a4a;">
              Please countersign and file this agreement. Follow up with the institution at: <strong>${institutionEmail}</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    // Send to institution
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: institutionEmail,
      subject: `FERPA Compliance Notice & DPA — Executed Copy — ${institutionName}`,
      body: institutionBody,
      from_name: 'Modal Education, LLC',
    });

    // Send to Modal admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'schools@modaleducation.com',
      subject: `New FERPA DPA Executed — ${institutionName}`,
      body: adminBody,
      from_name: 'Modal Itinerant System',
    });

    console.log(`FERPA DPA submitted by ${institutionName} (${institutionEmail})`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendFerpaDpa error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});