import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as base64 from 'npm:base64-js@1.5.1';

function encodeMessage(rawMessage) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(rawMessage);
  // URL-safe base64
  let b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      contactName,
      contactTitle,
      schoolName,
      schoolAddress,
      contactEmail,
      seats,
      plan,
      totalPrice,
      quoteDate,
      quoteNumber,
      currency,
      isCAD,
      pricePerSeat,
    } = body;

    if (!contactEmail || !contactEmail.includes("@")) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }

    const currencySymbol = isCAD ? "CA$" : "$";
    const currencyLabel = isCAD ? "CAD" : "USD";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Modal Education — Official Quote ${quoteNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#400070 0%,#6B2FB9 100%);padding:36px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png"
                    alt="Modal Education" height="48" style="display:block;margin-bottom:12px;background:#fff;border-radius:6px;padding:4px 8px;" />
                  <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">Modal Education</p>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:12px;">www.modaleducation.com</p>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:1px;">Official Quote</p>
                  <p style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:700;">#${quoteNumber}</p>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">Issued: ${quoteDate}</p>
                  <p style="margin:2px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">Valid for 30 days</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Prepared For -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="55%">
                  <p style="margin:0 0 8px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Prepared For</p>
                  <p style="margin:0;color:#111827;font-size:16px;font-weight:700;">${contactName}</p>
                  ${contactTitle ? `<p style="margin:2px 0 0;color:#6b7280;font-size:13px;">${contactTitle}</p>` : ""}
                  <p style="margin:4px 0 0;color:#374151;font-size:14px;font-weight:600;">${schoolName}</p>
                  ${schoolAddress ? `<p style="margin:2px 0 0;color:#6b7280;font-size:13px;">${schoolAddress}</p>` : ""}
                </td>
                <td width="45%" style="text-align:right;vertical-align:top;">
                  <p style="margin:0 0 8px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Annual Total</p>
                  <p style="margin:0;color:#400070;font-size:36px;font-weight:800;">${currencySymbol}${totalPrice.toLocaleString()}</p>
                  <p style="margin:2px 0 0;color:#9ca3af;font-size:12px;">${currencyLabel} / year</p>
                  <span style="display:inline-block;margin-top:8px;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">✓ 14-day free trial included</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Line Items -->
        <tr>
          <td style="padding:28px 40px 0;">
            <p style="margin:0 0 12px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Line Items</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr style="background:#f3e8ff;">
                <th style="text-align:left;padding:10px 14px;color:#400070;font-size:12px;font-weight:700;">Description</th>
                <th style="text-align:center;padding:10px 14px;color:#400070;font-size:12px;font-weight:700;">Seats</th>
                <th style="text-align:center;padding:10px 14px;color:#400070;font-size:12px;font-weight:700;">Rate / Seat</th>
                <th style="text-align:right;padding:10px 14px;color:#400070;font-size:12px;font-weight:700;">Total</th>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:14px;color:#111827;font-size:13px;font-weight:600;">
                  Modal Itinerant — ${plan.name} Plan
                  <div style="color:#9ca3af;font-size:11px;font-weight:400;margin-top:2px;">Annual subscription · All features included</div>
                </td>
                <td style="padding:14px;text-align:center;color:#374151;font-size:13px;">${seats}</td>
                <td style="padding:14px;text-align:center;color:#374151;font-size:13px;">${currencySymbol}${pricePerSeat}</td>
                <td style="padding:14px;text-align:right;color:#111827;font-size:14px;font-weight:700;">${currencySymbol}${totalPrice.toLocaleString()}</td>
              </tr>
              <tr style="background:#f0fdf4;border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 14px;color:#166534;font-size:12px;">14-Day Free Trial</td>
                <td style="padding:10px 14px;text-align:center;color:#166534;font-size:12px;">${seats}</td>
                <td style="padding:10px 14px;text-align:center;color:#166534;font-size:12px;">Complimentary</td>
                <td style="padding:10px 14px;text-align:right;color:#166534;font-size:12px;font-weight:700;">$0.00</td>
              </tr>
              <tr>
                <td colspan="3" style="padding:16px 14px 0;text-align:right;color:#374151;font-size:13px;font-weight:700;">Annual Total (${currencyLabel})</td>
                <td style="padding:16px 14px 0;text-align:right;color:#400070;font-size:22px;font-weight:800;">${currencySymbol}${totalPrice.toLocaleString()}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Features Included -->
        <tr>
          <td style="padding:28px 40px 0;">
            <div style="background:#f9f5ff;border-radius:12px;padding:20px 24px;">
              <p style="margin:0 0 14px;color:#400070;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">What's Included</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="50%" style="vertical-align:top;padding-right:12px;">
                    ${[
                      "Full access for every licensed teacher",
                      "AI-powered goal bank & lesson planner",
                      "Service log, calendar & scheduling tools",
                      "Listening checks & audiology tools",
                    ].map(f => `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;"><span style="color:#400070;font-weight:700;margin-top:1px;">✓</span><span style="color:#374151;font-size:12px;">${f}</span></div>`).join("")}
                  </td>
                  <td width="50%" style="vertical-align:top;">
                    ${[
                      "Worksheet & activity generators",
                      "District manager dashboard",
                      "Centralized team management",
                      "14-day free trial · No charge until trial ends",
                    ].map(f => `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;"><span style="color:#400070;font-weight:700;margin-top:1px;">✓</span><span style="color:#374151;font-size:12px;">${f}</span></div>`).join("")}
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Terms -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="border:1px solid #e9d5ff;border-radius:12px;padding:16px 20px;">
              <p style="margin:0 0 8px;color:#374151;font-size:12px;font-weight:700;">Notes & Terms</p>
              <ul style="margin:0;padding-left:16px;color:#6b7280;font-size:12px;line-height:1.8;">
                <li>This quote is valid for 30 days from the issue date and is subject to review and written approval by Modal Education prior to becoming binding.</li>
                <li>All pricing, rates, and terms set forth in this quote are estimates only and are not guaranteed until a purchase order or subscription agreement is executed and confirmed in writing by an authorized representative of Modal Education.</li>
                <li>No payment is due until after the 14-day free trial period ends.</li>
                <li>Subscriptions renew annually unless cancelled before the renewal date.</li>
                <li>Purchase orders accepted — contact contact@modaleducation.com for PO invoicing.</li>
              </ul>
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:28px 40px;">
            <div style="text-align:center;">
              <a href="https://modaleducation.com/SchoolsDistricts" style="display:inline-block;background:linear-gradient(135deg,#400070,#6B2FB9);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
                Start Your Free Trial →
              </a>
              <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
                Questions? <a href="mailto:contact@modaleducation.com" style="color:#400070;font-weight:600;">contact@modaleducation.com</a>
              </p>
              <p style="margin:8px 0 0;color:#d1d5db;font-size:11px;">Modal Education · www.modaleducation.com</p>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Helper to send via Gmail API
    async function sendViaGmail(to, subject, htmlContent, fromLabel) {
      const fromAddress = `${fromLabel} <contact@modaleducation.com>`;
      const boundary = `boundary_${Date.now()}`;
      const rawMessage = [
        `From: ${fromAddress}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: quoted-printable`,
        ``,
        htmlContent,
        `--${boundary}--`,
      ].join('\r\n');

      const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encoded }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`Gmail send error to ${to}:`, err);
        throw new Error(`Gmail API error: ${err}`);
      }
      return res.json();
    }

    // Save quote to database
    await base44.asServiceRole.entities.Quote.create({
      quoteNumber,
      contactName,
      contactTitle: contactTitle || "",
      contactEmail,
      schoolName,
      schoolAddress: schoolAddress || "",
      seats,
      planName: plan.name,
      currency,
      pricePerSeat,
      totalPrice,
      quoteDate,
      status: "sent",
    });

    // Send to the requester
    await sendViaGmail(
      contactEmail,
      `Quote #${quoteNumber} — Modal Itinerant for ${schoolName}`,
      htmlBody,
      "Modal Education"
    );

    // Send a copy to Modal Education
    await sendViaGmail(
      "contact@modaleducation.com",
      `[Quote Copy] #${quoteNumber} — ${schoolName} (${seats} seats, ${currencySymbol}${totalPrice.toLocaleString()} ${currencyLabel})`,
      htmlBody,
      "Modal Education Quote System"
    );

    console.log(`Quote ${quoteNumber} sent via Gmail to ${contactEmail} and contact@modaleducation.com`);
    return Response.json({ success: true });

  } catch (error) {
    console.error("sendQuoteEmail error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});