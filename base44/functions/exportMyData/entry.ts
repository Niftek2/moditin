import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const entityNames = [
      'Student',
      'ServiceEntry',
      'StudentGoal',
      'Goal',
      'GoalProgressEntry',
      'StudentAudiologySnapshot',
      'StudentContacts',
      'StudentAccommodation',
      'CalendarEvent',
      'MileageEntry',
      'Equipment',
      'EquipmentLog',
      'ActivityPlan',
      'PersonalReminder',
      'ReportDraft',
      'AssessmentEntry',
      'Ling6Session',
      'Ling6Trial',
      'WorksheetLog',
    ];

    const data = {};
    for (const name of entityNames) {
      try {
        const records = await base44.asServiceRole.entities[name].filter(
          { created_by_id: user.id },
          '-created_date',
          5000
        );
        // Strip internal fields not needed for re-import (keep id for cross-references)
        data[name] = records.map((r) => {
          const { created_by_id, updated_date, ...rest } = r;
          return rest;
        });
      } catch (e) {
        console.error(`Failed to export ${name}: ${e.message}`);
        data[name] = [];
      }
    }

    const exportPayload = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      account: {
        email: user.email,
        firstName: user.firstName || user.full_name || '',
      },
      data,
    };

    return Response.json(exportPayload);
  } catch (error) {
    console.error('exportMyData error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});