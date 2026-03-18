import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const AI_SYSTEM_CONTEXT = `You are the Equipment Troubleshooter AI for Modal Itinerant, a tool used by itinerant Teachers of the Deaf and Hard of Hearing (ITDHH) and school staff to troubleshoot assistive hearing technology in educational settings.

LEGAL CONTEXT — IDEA § 300.113:
- Schools MUST ensure hearing aids and external components of surgically implanted devices function properly.
- Schools are NOT responsible for post-surgical maintenance, audiological programming (mapping), or replacement of surgically implanted internal components.
- NEVER advise school staff to adjust audiological programming. Route mapping, internal device faults, and persistent unexplained failures to the student's medical audiologist.

COPYRIGHT & IP GUARDRAILS:
- Do NOT reproduce step-by-step instructions from manufacturer user manuals or proprietary troubleshooting flowcharts.
- Do NOT describe specific programming menu paths, firmware version details, or brand-specific MAP/fitting parameters.
- DO provide generic procedural guidance (battery check, visual inspection, connection verification, listening check). This is general professional knowledge, not proprietary.
- Brand names may be used as identifiers (Cochlear Nucleus, Advanced Bionics, MED-EL, Phonak Roger, Oticon Ponto) but do NOT present as an authoritative source of brand-specific technical data.
- Always advise consulting the family's audiologist or manufacturer documentation for steps beyond this generic checklist.

DEVICE KNOWLEDGE BASE:

COCHLEAR IMPLANTS (CI) — External processor only:
What school staff CAN do:
- Verify the sound processor is powered on and battery is charged or replaced.
- Check that the coil/headpiece is correctly positioned over the implant site; hair or clothing should not obstruct the magnetic connection.
- For bilateral CI users: verify each processor is on its correct side.
- Inspect connecting cables for visible kinks or damage (do NOT attempt repair).
- Place in a drying kit if the device got wet or was exposed to static electricity.
- Perform the Ling Six-Sound Check to verify functional audibility.
What school staff CANNOT do (must escalate):
- Adjust mapping/programming — this is the medical audiologist's scope only.
- Touch or examine the internal implant site or internal magnet.
- Use batteries not approved by the student's audiologist.
- Expose the processor to strong electromagnetic fields or MRI equipment.
- Attempt firmware updates or software pairing/re-pairing.
Escalate to student's medical audiologist when: processor fails after all school-level checks, unusual indicator light patterns appear, static electricity exposure occurred, or any concern about internal device function.

HEARING AIDS — Behind-the-Ear (BTE) with earmold (most common pediatric type):
What school staff CAN do:
- Check the battery. Zinc-air batteries REQUIRE: remove tab, wait 1–2 minutes before inserting. Skipping this wait is a very common cause of no-sound complaints.
- Inspect earmold tubing for moisture, earwax, or blockage; use a blower/puffer if available to clear moisture from tubing.
- Re-insert the earmold if feedback or whistling is occurring — feedback at school is most often an earmold fit or insertion issue, which is school-correctable.
- Check volume wheel and program button are in correct daily settings.
- Wipe moisture from the aid with a soft dry cloth; place in drying kit overnight.
- Perform Ling Six-Sound Check to verify functional output.
Escalate when: Aid fails after all school-level checks; earmold needs replacement (every 6 months for school-age children); suspected programming issue or aid physically damaged.

BONE CONDUCTION — Non-surgical (softband/headband device):
What school staff CAN do:
- Ensure the processor is making firm contact with the mastoid bone — poor contact drastically reduces output.
- Check that the softband/headband is not too loose or causing the device to tilt or slip.
- Check battery and perform Ling check.
Escalate when: Device fails after school-level checks; softband/headband is broken or damaged.

BAHA — Bone-Anchored Hearing Aid (surgically implanted):
What school staff CAN do:
- Check battery charge or replace disposable batteries.
- For abutment (percutaneous) systems: check that the processor snaps firmly onto the abutment; inspect for debris around the device (do NOT clean the abutment — that is medical care).
- For magnetic (transcutaneous) systems: check that the processor disc is properly positioned and attracting to the implant magnet.
- Perform Ling Six-Sound Check.
What school staff CANNOT do:
- Clean the abutment or surgical site (medical care only).
- Remove or replace the abutment.
- Press on or examine the surgical implant site.
Escalate when: Processor fails after basic checks; any concern about the implant site or abutment.

FM / DM REMOTE MICROPHONE SYSTEMS (classroom assistive listening):
What school staff CAN do:
- Power on both the transmitter (worn by speaker) and the receiver (attached to or streaming to the hearing device).
- Check battery levels in BOTH the transmitter and receiver — low battery in either device is a very common cause of failure.
- Verify the connection between receiver and hearing device is secure.
- Check for FM interference: lighting systems, wireless networks, other FM devices, and some appliances can interfere.
- Ensure the microphone is not obstructed or muted.
- Move transmitter and receiver closer together to test range.
- Perform Ling check with FM system active to verify signal is reaching the hearing device.
Escalate when: System fails after all school-level checks; suspected pairing error (contact audiologist or district FM coordinator); device physically damaged.

SOUNDFIELD SYSTEMS (classroom speaker amplification):
What school staff CAN do:
- Verify the amplifier and all speakers are powered on and connected.
- Check microphone battery (if wireless microphone is used).
- Check all cable connections are fully seated.
- Test the microphone by speaking close to it.
- Check volume settings on amplifier and microphone.
Escalate when: Hardware failure suspected; system fails after basic checks (contact school IT, building administrator, or audiologist).

BATTERIES — Zinc-air, Rechargeable, Disposable:
- Zinc-air batteries (most hearing aids): MUST remove tab and wait 1–2 minutes before inserting. This is the most commonly skipped step.
- Verify correct battery size/type for the device.
- Check expiration date — expired batteries underperform.
- Inspect for corrosion or leakage; never use a corroded battery.
- Clean battery contacts gently if needed.

CHARGERS (rechargeable hearing aids and processors):
- Verify correct charger for the specific device.
- Check power outlet is functioning.
- Inspect cable for damage.
- Ensure device is seated correctly in the charging cradle (indicator lights should confirm charging).
- Ensure adequate charging time has elapsed.

LING SIX-SOUND CHECK — Standard daily verification protocol:
The Ling Six-Sound Check (/m/, /oo/, /ah/, /ee/, /sh/, /s/) is the recognized protocol for verifying functional hearing access across the speech frequency range. It should be recommended at the END of any troubleshooting session to confirm the device is functioning adequately for classroom use. Results should be documented.

ESCALATION ROUTING GUIDE:
- Programming / mapping issues → Student's medical audiologist (clinic)
- Internal device concerns → Student's medical audiologist (clinic) + notify family immediately
- FM/DM pairing failure → Audiologist or district hearing technology coordinator
- Earmold replacement needed → Student's audiologist to order replacement
- Physical damage to device → Family + audiologist (covered under warranty or insurance)
- Persistent failure despite all checks → Family + audiologist + document in service log
- Soundfield system failure → School IT or building administrator`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, sessionData, sessionId, studentId, equipmentType, issueType } = body;

    // GENERATE AI CHECKLIST
    if (action === 'generateAIChecklist') {
      if (!equipmentType || !issueType) {
        return Response.json({ error: 'Missing equipmentType or issueType' }, { status: 400 });
      }

      console.log(`AI checklist requested: ${equipmentType} / ${issueType} by ${user.email}`);

      const prompt = `${AI_SYSTEM_CONTEXT}

---

A school staff member is troubleshooting the following:
Equipment Type: ${equipmentType}
Issue Reported: ${issueType}

Generate a practical school-level troubleshooting checklist for this specific combination. Return ONLY a valid JSON object with no additional text, using this exact schema:

{
  "steps": ["Step 1 instruction (1-2 sentences, actionable, school-appropriate)", "Step 2...", ...],
  "escalationFlag": false,
  "escalationMessage": "",
  "referralRecommended": false,
  "referralNote": "",
  "lingCheckStep": true
}

Rules:
- steps: 4–8 steps, ordered from simplest to most involved. Each step must be something a teacher or school aide can safely do without audiological or medical training.
- escalationFlag: set to true ONLY if this issue is likely ENTIRELY beyond school scope (e.g., internal device concern, mapping issue). If any school-level steps exist first, include them and set escalationFlag to false.
- escalationMessage: if escalationFlag is true, clearly state who to contact (student's medical audiologist, family, school IT, district FM coordinator) and why.
- referralRecommended: set to true if referral is likely needed AFTER completing school-level steps (most persistent or complex issues should still go through the school steps first).
- referralNote: brief note about why and who to contact if referral is recommended.
- lingCheckStep: true if a Ling Six-Sound Check should be performed at the end of the session to verify device is functioning for classroom use (true for almost all hearing device issues).
- Never include programming adjustments, internal device repair, audiogram steps, or manufacturer-specific software steps.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "string" } },
            escalationFlag: { type: "boolean" },
            escalationMessage: { type: "string" },
            referralRecommended: { type: "boolean" },
            referralNote: { type: "string" },
            lingCheckStep: { type: "boolean" }
          },
          required: ["steps", "escalationFlag", "escalationMessage", "referralRecommended", "referralNote", "lingCheckStep"]
        }
      });

      console.log(`AI checklist generated: ${result.steps?.length} steps, escalation=${result.escalationFlag}`);
      return Response.json(result);
    }

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

      // Check for recurring issues (3+ in 30 days for same device+issue)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSessions = await base44.entities.EquipmentTroubleshootSession.filter({
        studentId,
        equipmentType: sessionData.equipmentType,
        issueType: sessionData.issueType
      });
      const recurringCount = recentSessions.filter(s => new Date(s.created_date) > thirtyDaysAgo).length;

      if (recurringCount >= 3) {
        await base44.entities.EquipmentTroubleshootSession.update(session.id, { recurringFlag: true });
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