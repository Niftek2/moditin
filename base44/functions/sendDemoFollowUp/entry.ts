import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const email = body.email ?? body.data?.email;

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const emailBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f0f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#400070;padding:36px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#d4b8f0;text-transform:uppercase;">Modal Education</p>
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">We hope you enjoyed the demo!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#3d3d3d;line-height:1.7;">Thanks so much for taking the time to explore Modal Itinerant with our sample data!</p>
            <p style="margin:0 0 24px;font-size:16px;color:#3d3d3d;line-height:1.7;">We'd love to know what you think so we can keep improving. Do you have any questions or suggestions?</p>
            <p style="margin:0;font-size:16px;color:#3d3d3d;line-height:1.7;">Feel free to simply reply to this email to share your feedback or ask us anything. We're here to help!</p>
            <p style="margin:24px 0 0;font-size:16px;color:#3d3d3d;line-height:1.7;">Thank you for your valuable feedback!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <p style="margin:0;font-size:14px;font-weight:bold;color:#400070;">Looking forward to hearing from you,</p>
            <p style="margin:4px 0 0;font-size:14px;color:#3d3d3d;">The Modal Education Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #ede9f6;">
            <p style="margin:0;font-size:12px;color:#6b7280;">© 2026 Modal Education, LLC &nbsp;·&nbsp; <a href="https://modaleducation.com" style="color:#400070;text-decoration:underline;">modaleducation.com</a></p>
            <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">This email was sent because you explored the Modal Itinerant demo.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const subject = "Thanks for trying the Modal Itinerant demo! What did you think?";

    // Build RFC 2822 message
    const rawMessage = [
      `From: Nadia at Modal Education <nadia@modaleducation.com>`,
      `To: ${email}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      emailBody,
    ].join('\r\n');

    const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Gmail API error:', err);
      return Response.json({ error: `Gmail send failed: ${err}` }, { status: 500 });
    }

    console.log(`Demo follow-up email sent to ${email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending demo follow-up email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});