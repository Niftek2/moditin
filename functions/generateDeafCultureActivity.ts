import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gradeBand, activityType, readingLevel } = await req.json();

    if (!gradeBand || !activityType) {
      return Response.json({ error: 'Missing gradeBand or activityType' }, { status: 400 });
    }

    const prompt = `You are an expert educator creating text-based, Deaf-affirming cultural and identity activities for Deaf/Hard of Hearing students.

PARAMETERS:
- Grade Band: ${gradeBand}
- Activity Type: ${activityType}
- Reading Level: ${readingLevel || "Grade-appropriate"}

ACTIVITY TYPES:
1. "Community History" - Mini-research or discussion on Deaf community history
2. "Identity Reflection" - Personal reflection prompts about Deaf identity and communication modality
3. "Deaf Professionals" - Biography exploration or career awareness activities
4. "Accessibility Audit" - Examining visual access in various environments
5. "Self-Advocacy Scenarios" - Scenario-based communication strategy practice
6. "Communication Analysis" - Analyzing communication breakdowns and solutions

GENERATE A STRUCTURED ACTIVITY with:
- Clear Objective (age-appropriate, linked to Deaf empowerment/awareness)
- Materials List (text-based, no videos or copyrighted content)
- Procedure (step-by-step instructions, 2-4 steps)
- Reflection Questions (2-3 open-ended questions)
- Suggested Duration

RULES:
1. Do NOT embed or link to videos.
2. Do NOT include copyrighted materials; use placeholders for resources.
3. Use placeholder "XX" for student name.
4. Adjust language complexity per reading level.
5. Activities should affirm Deaf culture and identity, not frame it as deficit.
6. Include practical applications relevant to classroom/school life.

Return JSON with this exact structure:
{
  "title": string,
  "objective": string,
  "materials": [string],
  "procedure": [string],
  "reflectionQuestions": [string],
  "suggestedDuration": string,
  "gradeBandTarget": string,
  "notes": string
}`;

    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        objective: { type: "string" },
        materials: { type: "array", items: { type: "string" } },
        procedure: { type: "array", items: { type: "string" } },
        reflectionQuestions: { type: "array", items: { type: "string" } },
        suggestedDuration: { type: "string" },
        gradeBandTarget: { type: "string" },
        notes: { type: "string" },
      },
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });

    return Response.json({
      success: true,
      activity: result,
    });
  } catch (error) {
    console.error("Error generating Deaf culture activity:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});