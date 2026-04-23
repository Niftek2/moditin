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
      <td class="behind-row" style="padding:12px 16px;border-bottom:1px solid #FCD34D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <span class="behind-avatar" style="display:inline-block;width:32px;height:32px;border-radius:16px;background:#FEF3C7;color:#92400E;text-align:center;line-height:32px;font-weight:700;font-size:13px;vertical-align:middle;margin-right:10px;">
          ${(s.studentInitials || "?").charAt(0)}
        </span>
        <span class="behind-name" style="font-size:14px;font-weight:600;color:#1A1028;vertical-align:middle;">${s.studentInitials || "—"}</span>
      </td>
      <td class="behind-row" style="padding:12px 16px;border-bottom:1px solid #FCD34D;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        ${s.reqDirect ? `
          <div class="behind-stats" style="font-size:13px;color:#92400E;font-weight:600;">Direct: ${s.loggedDirect}/${s.reqDirect} min (${s.directPct}%)</div>
        ` : ""}
        ${s.reqIndirect ? `
          <div class="behind-stats" style="font-size:12px;color:#92400E;margin-top:2px;">Indirect: ${s.loggedIndirect}/${s.reqIndirect} min (${s.indirectPct}%)</div>
        ` : ""}
      </td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Monthly Compliance Summary</title>
<style>
  /* Mobile */
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; border-radius: 0 !important; }
    .px-32 { padding-left: 20px !important; padding-right: 20px !important; }
    .stat-cell { display: block !important; width: 100% !important; padding: 6px 0 !important; }
    .header-title { font-size: 20px !important; }
  }
  /* Dark mode (Apple Mail, Outlook.com — Gmail mobile ignores this and auto-inverts instead) */
  @media (prefers-color-scheme: dark) {
    body, .bg-page { background: #1A1028 !important; }
    .card { background: #2A1A3E !important; box-shadow: none !important; }
    .text-primary { color: #F5EFFB !important; }
    .text-muted { color: #C4B5D4 !important; }
    .behind-section-title { color: #FCD34D !important; }
    .behind-table { background: #3A2A10 !important; border-color: #6B4A1C !important; }
    .behind-row { border-color: #6B4A1C !important; }
    .behind-avatar { background: #6B4A1C !important; color: #FCD34D !important; }
    .behind-name { color: #F5EFFB !important; }
    .behind-stats { color: #FCD34D !important; }
    .ontrack-box { background: #0F3A2A !important; border-color: #1E5C44 !important; }
    .ontrack-title, .ontrack-text { color: #6EE7B7 !important; }
    .footer { background: #140A1F !important; border-color: #2A1A3E !important; }
    .footer-text { color: #A89BB8 !important; }
    .footer-link { color: #C4A8E0 !important; }
  }
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background:#F7F3FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1028;">
  <table width="100%" cellpadding="0" cellspacing="0" class="bg-page" style="background:#F7F3FA;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" class="container card" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(64,0,112,0.08);">

          <!-- Header (solid purple — works in both light & dark mail clients) -->
          <tr>
            <td class="px-32" style="background:#400070;padding:32px;text-align:center;">
              <div style="display:inline-block;padding:8px 14px;background:#FFFFFF;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#400070;text-transform:uppercase;margin-bottom:16px;">
                Modal Itinerant
              </div>
              <h1 class="header-title" style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;line-height:1.3;mso-line-height-rule:exactly;">
                Monthly Compliance Summary
              </h1>
              <p style="margin:10px 0 0 0;color:#FFFFFF;font-size:14px;font-weight:500;opacity:0.95;">${monthLabel}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="px-32" style="padding:28px 32px 8px 32px;">
              <p class="text-primary" style="margin:0 0 8px 0;font-size:16px;color:#1A1028;">Hi ${firstName || "there"},</p>
              <p class="text-muted" style="margin:0;font-size:14px;line-height:1.6;color:#4A4A4A;">
                Here's your service minute compliance summary for <strong>${monthLabel}</strong>.
              </p>
            </td>
          </tr>

          <!-- Stats row — high-contrast filled cards so auto-invert keeps them readable -->
          <tr>
            <td class="px-32" style="padding:20px 32px 12px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" class="stat-cell" style="padding:6px;vertical-align:top;">
                    <div class="stat-box-neutral" style="background:#400070;border-radius:12px;padding:18px 12px;text-align:center;">
                      <div class="stat-box-neutral-text" style="font-size:32px;font-weight:800;color:#FFFFFF;line-height:1;">${totalTracked}</div>
                      <div class="stat-box-neutral-label" style="font-size:11px;color:#FFFFFF;margin-top:8px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;opacity:0.9;">Tracked</div>
                    </div>
                  </td>
                  <td width="33%" class="stat-cell" style="padding:6px;vertical-align:top;">
                    <div class="stat-box-green" style="background:#047857;border-radius:12px;padding:18px 12px;text-align:center;">
                      <div class="stat-box-green-text" style="font-size:32px;font-weight:800;color:#FFFFFF;line-height:1;">${onTrackCount}</div>
                      <div class="stat-box-green-label" style="font-size:11px;color:#FFFFFF;margin-top:8px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;opacity:0.9;">On Track</div>
                    </div>
                  </td>
                  <td width="33%" class="stat-cell" style="padding:6px;vertical-align:top;">
                    <div class="stat-box-amber" style="background:${hasBehind ? "#B45309" : "#6B7280"};border-radius:12px;padding:18px 12px;text-align:center;">
                      <div class="stat-box-amber-text" style="font-size:32px;font-weight:800;color:#FFFFFF;line-height:1;">${behindStudents.length}</div>
                      <div class="stat-box-amber-label" style="font-size:11px;color:#FFFFFF;margin-top:8px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;opacity:0.9;">Behind</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${hasBehind ? `
          <!-- Behind students -->
          <tr>
            <td class="px-32" style="padding:12px 32px 8px 32px;">
              <h2 class="behind-section-title" style="margin:0 0 10px 0;font-size:16px;font-weight:700;color:#92400E;">
                ⚠️ Students Needing Attention
              </h2>
              <p class="text-muted" style="margin:0 0 14px 0;font-size:13px;color:#4A4A4A;line-height:1.5;">
                The following ${behindStudents.length === 1 ? "student was" : "students were"} below required service minutes last month:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" class="behind-table" style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:12px;overflow:hidden;">
                ${behindRowsHtml}
              </table>
            </td>
          </tr>
          ` : `
          <!-- All on track -->
          <tr>
            <td class="px-32" style="padding:12px 32px 8px 32px;">
              <div class="ontrack-box" style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:24px;text-align:center;">
                <div style="font-size:32px;margin-bottom:8px;">🎉</div>
                <h2 class="ontrack-title" style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#047857;">All students on track!</h2>
                <p class="ontrack-text" style="margin:0;font-size:13px;color:#047857;">Every tracked student met their required service minutes for ${monthLabel}.</p>
              </div>
            </td>
          </tr>
          `}

          <!-- CTA -->
          <tr>
            <td class="px-32" style="padding:24px 32px 32px 32px;text-align:center;">
              <a href="https://app.base44.com/ComplianceReport" class="cta-btn" style="display:inline-block;background:#400070;color:#FFFFFF;font-size:14px;font-weight:600;padding:14px 28px;border-radius:12px;text-decoration:none;">
                View Full Compliance Report
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer px-32" style="background:#F7F3FA;padding:20px 32px;border-top:1px solid #EADDF5;text-align:center;">
              <p class="footer-text" style="margin:0 0 4px 0;font-size:11px;color:#4A4A4A;line-height:1.5;">
                You're receiving this because monthly compliance notices are enabled in your settings.
              </p>
              <p class="footer-text" style="margin:0;font-size:11px;color:#4A4A4A;">
                <a href="https://app.base44.com/Settings" class="footer-link" style="color:#6B2FB9;text-decoration:none;">Manage notification preferences</a>
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