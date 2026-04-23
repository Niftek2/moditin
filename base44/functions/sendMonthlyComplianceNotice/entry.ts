import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function getRequiredMinutesPerMonth(minutes, frequency) {
  if (!minutes || !frequency) return null;
  switch (frequency) {
    case "Daily":    return minutes * 20;
    case "Weekly":   return minutes * 4;
    case "Monthly":  return minutes;
    case "Annually": return Math.round(minutes / 10);
    default:         return null;
  }
}

function getPreviousMonthKey() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return {
    key: d.toISOString().slice(0, 7),
    label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

function renderEmailHTML({ firstName, monthLabel, behindStudents, onTrackCount, totalTracked }) {
  const hasBehind = behindStudents.length > 0;

  const behindRowsHtml = behindStudents.map(s => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #EADDF5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#EADDF5;color:#400070;text-align:center;line-height:32px;font-weight:700;font-size:13px;vertical-align:middle;margin-right:10px;">
          ${(s.studentInitials || "?").charAt(0)}
        </div>
        <span style="font-size:14px;font-weight:600;color:#1A1028;vertical-align:middle;">${s.studentInitials || "—"}</span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #EADDF5;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        ${s.reqDirect ? `
          <div style="font-size:13px;color:#92400E;font-weight:600;">Direct: ${s.loggedDirect}/${s.reqDirect} min (${s.directPct}%)</div>
        ` : ""}
        ${s.reqIndirect ? `
          <div style="font-size:12px;color:#92400E;margin-top:2px;">Indirect: ${s.loggedIndirect}/${s.reqIndirect} min (${s.indirectPct}%)</div>
        ` : ""}
      </td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Monthly Compliance Summary</title>
</head>
<body style="margin:0;padding:0;background:#F7F3FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1028;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3FA;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(64,0,112,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#400070 0%,#6B2FB9 100%);padding:32px 32px 24px 32px;text-align:center;">
              <div style="display:inline-block;padding:8px 14px;background:rgba(255,255,255,0.15);border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#FFFFFF;text-transform:uppercase;margin-bottom:16px;">
                Modal Itinerant
              </div>
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;line-height:1.3;">
                Monthly Compliance Summary
              </h1>
              <p style="margin:8px 0 0 0;color:#EADDF5;font-size:14px;">${monthLabel}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <p style="margin:0 0 8px 0;font-size:16px;color:#1A1028;">Hi ${firstName || "there"},</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#4A4A4A;">
                Here's your service minute compliance summary for <strong>${monthLabel}</strong>.
              </p>
            </td>
          </tr>

          <!-- Stats row -->
          <tr>
            <td style="padding:24px 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding:8px;">
                    <div style="background:#F7F3FA;border:1px solid #EADDF5;border-radius:12px;padding:16px;text-align:center;">
                      <div style="font-size:28px;font-weight:700;color:#400070;line-height:1;">${totalTracked}</div>
                      <div style="font-size:11px;color:#4A4A4A;margin-top:6px;text-transform:uppercase;letter-spacing:0.5px;">Tracked</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:8px;">
                    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:16px;text-align:center;">
                      <div style="font-size:28px;font-weight:700;color:#047857;line-height:1;">${onTrackCount}</div>
                      <div style="font-size:11px;color:#047857;margin-top:6px;text-transform:uppercase;letter-spacing:0.5px;">On Track</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:8px;">
                    <div style="background:${hasBehind ? "#FEF3C7" : "#F7F3FA"};border:1px solid ${hasBehind ? "#FCD34D" : "#EADDF5"};border-radius:12px;padding:16px;text-align:center;">
                      <div style="font-size:28px;font-weight:700;color:${hasBehind ? "#92400E" : "#4A4A4A"};line-height:1;">${behindStudents.length}</div>
                      <div style="font-size:11px;color:${hasBehind ? "#92400E" : "#4A4A4A"};margin-top:6px;text-transform:uppercase;letter-spacing:0.5px;">Behind</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${hasBehind ? `
          <!-- Behind students -->
          <tr>
            <td style="padding:16px 32px 8px 32px;">
              <h2 style="margin:0 0 12px 0;font-size:16px;font-weight:700;color:#92400E;">
                ⚠️ Students Needing Attention
              </h2>
              <p style="margin:0 0 16px 0;font-size:13px;color:#4A4A4A;line-height:1.5;">
                The following ${behindStudents.length === 1 ? "student was" : "students were"} below required service minutes last month:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:12px;overflow:hidden;">
                ${behindRowsHtml}
              </table>
            </td>
          </tr>
          ` : `
          <!-- All on track -->
          <tr>
            <td style="padding:16px 32px 8px 32px;">
              <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:24px;text-align:center;">
                <div style="font-size:32px;margin-bottom:8px;">🎉</div>
                <h2 style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#047857;">All students on track!</h2>
                <p style="margin:0;font-size:13px;color:#047857;">Every tracked student met their required service minutes for ${monthLabel}.</p>
              </div>
            </td>
          </tr>
          `}

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 32px 32px;text-align:center;">
              <a href="https://app.base44.com/ComplianceReport" style="display:inline-block;background:#400070;color:#FFFFFF;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
                View Full Compliance Report
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F3FA;padding:20px 32px;border-top:1px solid #EADDF5;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:11px;color:#4A4A4A;">
                You're receiving this because monthly compliance notices are enabled in your settings.
              </p>
              <p style="margin:0;font-size:11px;color:#4A4A4A;">
                <a href="https://app.base44.com/Settings" style="color:#6B2FB9;text-decoration:none;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

async function computeComplianceForUser(base44, userEmail, monthKey) {
  const students = await base44.asServiceRole.entities.Student.filter({ created_by: userEmail });
  const services = await base44.asServiceRole.entities.ServiceEntry.filter({ created_by: userEmail, monthKey });

  const studentStats = (students || [])
    .filter(s => !s.consultOnly)
    .map(student => {
      const reqDirect = getRequiredMinutesPerMonth(student.directMinutes, student.directMinutesFrequency);
      const reqIndirect = getRequiredMinutesPerMonth(student.indirectMinutes, student.indirectMinutesFrequency);
      if (!reqDirect && !reqIndirect) return null;

      const studentServices = services.filter(s => s.studentId === student.id);
      const loggedDirect = studentServices.filter(s => s.category === "DirectService").reduce((sum, s) => sum + (s.minutes || 0), 0);
      const loggedIndirect = studentServices.filter(s => ["Planning", "Consultation"].includes(s.category)).reduce((sum, s) => sum + (s.minutes || 0), 0);

      const directPct = reqDirect ? Math.round((loggedDirect / reqDirect) * 100) : 100;
      const indirectPct = reqIndirect && reqIndirect > 0 ? Math.round((loggedIndirect / reqIndirect) * 100) : 100;
      const isBehind = (reqDirect && loggedDirect < reqDirect) || (reqIndirect && reqIndirect > 0 && loggedIndirect < reqIndirect);

      return {
        studentInitials: student.studentInitials,
        reqDirect, loggedDirect, directPct,
        reqIndirect, loggedIndirect, indirectPct,
        isBehind,
      };
    })
    .filter(Boolean);

  const behindStudents = studentStats.filter(s => s.isBehind).sort((a, b) => {
    const aWorst = Math.min(a.directPct ?? 100, a.indirectPct ?? 100);
    const bWorst = Math.min(b.directPct ?? 100, b.indirectPct ?? 100);
    return aWorst - bWorst;
  });

  return {
    totalTracked: studentStats.length,
    onTrackCount: studentStats.filter(s => !s.isBehind).length,
    behindStudents,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { testMode, testEmail, testUserEmail } = body;

    const { key: monthKey, label: monthLabel } = getPreviousMonthKey();

    // TEST MODE: send a single email to testEmail using testUserEmail's caseload (or the caller's)
    if (testMode) {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const sourceEmail = testUserEmail || user.email;
      const recipientEmail = testEmail || user.email;

      const stats = await computeComplianceForUser(base44, sourceEmail, monthKey);
      const html = renderEmailHTML({
        firstName: user.firstName || "there",
        monthLabel,
        ...stats,
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipientEmail,
        from_name: "Modal Itinerant",
        subject: `[TEST] Your ${monthLabel} Compliance Summary`,
        body: html,
      });

      return Response.json({
        success: true,
        mode: "test",
        sentTo: recipientEmail,
        sourceCaseload: sourceEmail,
        monthKey,
        stats: { totalTracked: stats.totalTracked, onTrackCount: stats.onTrackCount, behindCount: stats.behindStudents.length },
      });
    }

    // PRODUCTION MODE: send to all users who opted in
    const optedInUsers = await base44.asServiceRole.entities.User.filter({ sendMonthlyComplianceNotice: true });
    console.log(`Found ${optedInUsers.length} users opted in to monthly compliance notices`);

    const results = [];
    for (const u of optedInUsers) {
      try {
        const stats = await computeComplianceForUser(base44, u.email, monthKey);
        if (stats.totalTracked === 0) {
          results.push({ email: u.email, skipped: true, reason: "no tracked students" });
          continue;
        }
        const html = renderEmailHTML({
          firstName: u.firstName || "there",
          monthLabel,
          ...stats,
        });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          from_name: "Modal Itinerant",
          subject: `Your ${monthLabel} Compliance Summary`,
          body: html,
        });
        results.push({ email: u.email, sent: true, behindCount: stats.behindStudents.length });
      } catch (err) {
        console.error(`Failed to send to ${u.email}:`, err.message);
        results.push({ email: u.email, error: err.message });
      }
    }

    return Response.json({ success: true, monthKey, totalUsers: optedInUsers.length, results });
  } catch (error) {
    console.error("sendMonthlyComplianceNotice error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});