import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no auth) or admin-triggered calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch (_) {}

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 7);
    const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`Checking IEP reviews due on: ${targetDateStr}`);

    // Get all students with an annual review date matching 7 days from now
    const students = await base44.asServiceRole.entities.Student.list();
    const upcoming = students.filter(s => s.iepAnnualReviewDate === targetDateStr);

    console.log(`Found ${upcoming.length} students with IEP review in 7 days`);

    let created = 0;

    for (const student of upcoming) {
      // Check if a notification already exists for this student + this review date
      const existing = await base44.asServiceRole.entities.AppNotification.filter({
        studentId: student.id,
        type: 'IEPAnnualReviewReminder',
      });

      const alreadyNotified = existing.some(n => n.body?.includes(targetDateStr));

      if (alreadyNotified) {
        console.log(`Skipping student ${student.id} — already notified`);
        continue;
      }

      await base44.asServiceRole.entities.AppNotification.create({
        type: 'IEPAnnualReviewReminder',
        title: `IEP Annual Review in 7 days`,
        body: `${student.studentInitials}'s IEP annual review is due on ${targetDateStr}.`,
        studentId: student.id,
        triggerDateTime: new Date().toISOString(),
        isRead: false,
        ownerEmail: student.created_by,
      });

      created++;
      console.log(`Created reminder for student ${student.id}`);
    }

    return Response.json({ success: true, checked: upcoming.length, created });
  } catch (error) {
    console.error('Error in iepReviewReminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});