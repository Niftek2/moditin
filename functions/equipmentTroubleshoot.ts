import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, sessionData, sessionId, studentId } = await req.json();

    // CREATE SESSION
    if (action === 'createSession') {
      const session = await base44.entities.EquipmentTroubleshootSession.create({
        studentId,
        equipmentType: sessionData.equipmentType,
        issueType: sessionData.issueType,
        stepsTaken: sessionData.stepsTaken || [],
        outcome: sessionData.outcome,
        referralSuggested: sessionData.referralSuggested || false,
        notes: sessionData.notes || ''
      });

      // Check for recurring issues
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSessions = await base44.entities.EquipmentTroubleshootSession.filter({
        studentId,
        equipmentType: sessionData.equipmentType,
        issueType: sessionData.issueType
      });

      const recurringCount = recentSessions.filter(s => new Date(s.created_date) > thirtyDaysAgo).length;

      if (recurringCount >= 3) {
        await base44.entities.EquipmentTroubleshootSession.update(session.id, {
          recurringFlag: true
        });
      }

      return Response.json({ session, isRecurring: recurringCount >= 3 });
    }

    // GET SESSIONS FOR STUDENT
    if (action === 'getSessionsForStudent') {
      const sessions = await base44.entities.EquipmentTroubleshootSession.filter({ studentId });
      return Response.json({ sessions });
    }

    // GET SESSION DETAILS
    if (action === 'getSessionDetails') {
      const session = await base44.entities.EquipmentTroubleshootSession.list();
      const steps = await base44.entities.EquipmentTroubleshootStep.filter({ sessionId });
      return Response.json({ session: session.find(s => s.id === sessionId), steps });
    }

    // CHECK RECURRING
    if (action === 'checkRecurring') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allSessions = await base44.entities.EquipmentTroubleshootSession.filter({ studentId });
      const groupedByEquipmentIssue = {};

      allSessions.forEach(session => {
        if (new Date(session.created_date) > thirtyDaysAgo) {
          const key = `${session.equipmentType}-${session.issueType}`;
          groupedByEquipmentIssue[key] = (groupedByEquipmentIssue[key] || 0) + 1;
        }
      });

      const recurring = Object.entries(groupedByEquipmentIssue)
        .filter(([_, count]) => count >= 3)
        .map(([key]) => key);

      return Response.json({ recurring });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Equipment troubleshoot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});