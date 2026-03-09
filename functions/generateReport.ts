import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { reportData, assessments, backgroundData, hearingData, presentLevels, accommodations, recommendations } = body;

    const pronouns = getPronounSet(reportData.pronouns || 'they/them');

    // Generate each section narrative
    const backgroundNarrative = generateBackgroundNarrative(backgroundData, reportData, pronouns);
    const hearingNarrative = generateHearingNarrative(hearingData, reportData, pronouns);
    const assessmentNarratives = assessments.map(a => ({
      ...a,
      generatedNarrative: generateAssessmentNarrative(a, reportData, pronouns)
    }));
    const presentLevelsSummary = generatePresentLevelsSummary(presentLevels, backgroundData, hearingData, assessmentNarratives, reportData, pronouns);
    const accommodationsText = generateAccommodationsText(accommodations, pronouns);
    const recommendationsText = generateRecommendationsText(recommendations, reportData, pronouns);

    return Response.json({
      backgroundNarrative,
      hearingNarrative,
      assessmentNarratives,
      presentLevelsSummary,
      accommodationsText,
      recommendationsText
    });
  } catch (error) {
    console.error('generateReport error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getPronounSet(pronouns) {
  const map = {
    'she/her': { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself' },
    'he/him': { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself' },
    'they/them': { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' },
  };
  return map[pronouns] || map['they/them'];
}

function generateBackgroundNarrative(bg, report, pro) {
  if (!bg) return '';
  const initials = report.studentInitials || 'the student';
  const parts = [];

  if (bg.audiologicalHistory) {
    parts.push(`${initials} has a documented history of hearing loss. ${bg.audiologicalHistory}`);
  }
  if (bg.amplificationHistory) {
    parts.push(`Regarding amplification, ${bg.amplificationHistory}`);
  }
  if (bg.communicationHome) {
    parts.push(`At home, the primary communication method is ${bg.communicationHome}.`);
  }
  if (bg.familyLanguageAccess) {
    parts.push(`Family language access information indicates: ${bg.familyLanguageAccess}`);
  }
  if (bg.generalHealthHistory) {
    parts.push(`From a health history perspective, ${bg.generalHealthHistory}`);
  }
  if (bg.familyHistoryHL) {
    parts.push(`There is a reported family history of hearing loss: ${bg.familyHistoryHL}`);
  }
  if (bg.developmentalHistory) {
    parts.push(`Developmentally, ${bg.developmentalHistory}`);
  }
  if (bg.caregiverConcerns) {
    parts.push(`Caregiver concerns noted at this time include: ${bg.caregiverConcerns}`);
  }
  if (bg.accessConcerns) {
    parts.push(`Access concerns reported include: ${bg.accessConcerns}`);
  }
  if (bg.deviceIndependence) {
    const skills = [];
    if (bg.deviceIndependence.batteryManagement) skills.push('battery management');
    if (bg.deviceIndependence.charging) skills.push('charging');
    if (bg.deviceIndependence.reportingIssues) skills.push('reporting device issues');
    if (bg.deviceIndependence.cleaning) skills.push('cleaning devices');
    if (bg.deviceIndependence.puttingOnOff) skills.push('putting on and taking off devices');
    if (skills.length > 0) {
      parts.push(`${initials} demonstrates independence with the following device management skills: ${skills.join(', ')}.`);
    }
  }
  if (bg.homeSupportNotes) {
    parts.push(`Additional home support notes: ${bg.homeSupportNotes}`);
  }

  return parts.length > 0 ? parts.join(' ') : '';
}

function generateHearingNarrative(hearing, report, pro) {
  if (!hearing) return '';
  const initials = report.studentInitials || 'the student';
  const parts = [];

  const laterality = hearing.laterality || '';
  const isUnilateral = laterality.toLowerCase().includes('unilateral');
  const isBilateral = laterality.toLowerCase().includes('bilateral');

  if (laterality && hearing.severity) {
    if (isBilateral) {
      parts.push(`${initials} presents with a bilateral ${hearing.severity.toLowerCase()} hearing loss.`);
    } else if (isUnilateral) {
      parts.push(`${initials} presents with a unilateral hearing loss, affecting ${hearing.betterEar ? 'the ' + hearing.betterEar + ' ear as the better ear' : 'one ear'}.`);
    } else {
      parts.push(`${initials} presents with ${hearing.severity?.toLowerCase() || 'a'} hearing loss.`);
    }
  }

  if (hearing.audiogramDate) {
    parts.push(`The most recent audiogram is dated ${hearing.audiogramDate}.`);
  }

  if (hearing.rightEarType && isBilateral) {
    parts.push(`The right ear presents with a ${hearing.rightEarType.toLowerCase()} hearing loss, and the left ear presents with a ${hearing.leftEarType?.toLowerCase() || ''} hearing loss.`);
  }

  if (hearing.speechRecognition) {
    parts.push(`Speech recognition findings indicate: ${hearing.speechRecognition}`);
  }

  if (hearing.tympanometry) {
    parts.push(`Tympanometry results were as follows: ${hearing.tympanometry}`);
  }

  if (hearing.deviceType) {
    parts.push(`${initials} currently uses ${hearing.deviceType}${hearing.deviceModel ? ' (' + hearing.deviceModel + ')' : ''} for auditory access.`);
  } else {
    parts.push(`At this time, ${initials} does not use amplification devices.`);
  }

  if (hearing.aldUse) {
    parts.push(`Assistive listening device use: ${hearing.aldUse}`);
  }

  if (hearing.recommendedWearTime) {
    parts.push(`Recommended wear time: ${hearing.recommendedWearTime}`);
  }

  if (hearing.educationalImpact) {
    parts.push(`Educational impact of hearing loss: ${hearing.educationalImpact}`);
  }

  if (hearing.auditoryAccessNotes) {
    parts.push(`Additional auditory access notes: ${hearing.auditoryAccessNotes}`);
  }

  return parts.join(' ');
}

function generateAssessmentNarrative(assessment, report, pro) {
  const initials = report.studentInitials || 'the student';
  const type = assessment.assessmentType;
  const scores = assessment.rawScores || {};
  const parts = [];

  parts.push(`The ${type} was administered on ${assessment.assessmentDate || 'the recorded date'}.`);

  // Score-specific language by assessment type
  if (type === 'DTAP') {
    if (scores.languageScore) parts.push(`The language score was ${scores.languageScore}.`);
    if (scores.nonlanguageScore) parts.push(`The nonlanguage score was ${scores.nonlanguageScore}.`);
    if (scores.noiseImpact) parts.push(`Noise impact observations: ${scores.noiseImpact}`);
    if (scores.discriminationObservations) parts.push(`Discrimination observations: ${scores.discriminationObservations}`);
    if (scores.listeningFatigue) parts.push(`Listening fatigue was noted as follows: ${scores.listeningFatigue}`);
  } else if (type === 'LING Sounds') {
    if (scores.quietAccess) parts.push(`Access to Ling sounds in quiet: ${scores.quietAccess}`);
    if (scores.noiseAccess) parts.push(`Access to Ling sounds in noise: ${scores.noiseAccess}`);
    if (scores.distancePerformance) parts.push(`Distance performance: ${scores.distancePerformance}`);
    if (scores.overallSummary) parts.push(`Overall access summary: ${scores.overallSummary}`);
  } else if (type === 'TAPS-4') {
    if (scores.numbers) parts.push(`Numbers score: ${scores.numbers}`);
    if (scores.words) parts.push(`Words score: ${scores.words}`);
    if (scores.sentences) parts.push(`Sentences score: ${scores.sentences}`);
    if (scores.memoryNotes) parts.push(`Auditory memory/processing notes: ${scores.memoryNotes}`);
  } else if (type === 'OWLS-II') {
    if (scores.receptiveScore) parts.push(`Receptive language score: ${scores.receptiveScore}`);
    if (scores.expressiveScore) parts.push(`Expressive language score: ${scores.expressiveScore}`);
    if (scores.strengths) parts.push(`Identified strengths include: ${scores.strengths}`);
    if (scores.developing) parts.push(`Areas developing: ${scores.developing}`);
  } else if (type === 'TACL') {
    if (scores.score) parts.push(`Composite score: ${scores.score}`);
    if (scores.comprehensionFindings) parts.push(`Comprehension findings: ${scores.comprehensionFindings}`);
    if (scores.strengths) parts.push(`Strengths noted: ${scores.strengths}`);
  } else if (type === 'TEXL') {
    if (scores.expressiveData) parts.push(`Expressive language data: ${scores.expressiveData}`);
    if (scores.qualitativeNotes) parts.push(`Qualitative observations: ${scores.qualitativeNotes}`);
  } else if (type === 'TNL-2') {
    if (scores.comprehensionScore) parts.push(`Narrative comprehension score: ${scores.comprehensionScore}`);
    if (scores.expressionScore) parts.push(`Narrative expression score: ${scores.expressionScore}`);
    if (scores.findings) parts.push(`Findings: ${scores.findings}`);
  } else if (type === 'One Word Picture Vocabulary Test') {
    if (scores.score) parts.push(`Standard score: ${scores.score}`);
    if (scores.strengths) parts.push(`Vocabulary strengths: ${scores.strengths}`);
    if (scores.vocabularyNeeds) parts.push(`Vocabulary areas of need: ${scores.vocabularyNeeds}`);
  } else if (type === 'Craig Speechreading') {
    if (scores.scorePercent) parts.push(`Speechreading score: ${scores.scorePercent}`);
    if (scores.visualAttention) parts.push(`Visual attention observations: ${scores.visualAttention}`);
    if (scores.visualDependence) parts.push(`Dependence on visual cues: ${scores.visualDependence}`);
  } else if (type === 'TOSCRF-2') {
    if (scores.score) parts.push(`Reading fluency score: ${scores.score}`);
    if (scores.fluencyObservations) parts.push(`Fluency observations: ${scores.fluencyObservations}`);
  } else if (type === 'SIFTER') {
    const areas = [];
    if (scores.academics) areas.push(`academics: ${scores.academics}`);
    if (scores.attention) areas.push(`attention: ${scores.attention}`);
    if (scores.communication) areas.push(`communication: ${scores.communication}`);
    if (scores.participation) areas.push(`participation: ${scores.participation}`);
    if (scores.behavior) areas.push(`behavior: ${scores.behavior}`);
    if (areas.length > 0) parts.push(`SIFTER ratings: ${areas.join('; ')}.`);
    if (scores.comments) parts.push(`Teacher comments: ${scores.comments}`);
  } else if (type === 'Functional Listening Evaluation') {
    const fleResults = [];
    if (scores.quietClose) fleResults.push(`quiet/close: ${scores.quietClose}`);
    if (scores.quietDistance) fleResults.push(`quiet/distance: ${scores.quietDistance}`);
    if (scores.noiseClose) fleResults.push(`noise/close: ${scores.noiseClose}`);
    if (scores.noiseDistance) fleResults.push(`noise/distance: ${scores.noiseDistance}`);
    if (fleResults.length > 0) parts.push(`Functional listening performance: ${fleResults.join(', ')}.`);
    if (scores.comments) parts.push(`Comments: ${scores.comments}`);
  } else if (type === 'SKI-HI Language Development') {
    if (scores.developmentalObservations) parts.push(`Developmental observations: ${scores.developmentalObservations}`);
    if (scores.languageStrengths) parts.push(`Language strengths: ${scores.languageStrengths}`);
    if (scores.languageNeeds) parts.push(`Language needs: ${scores.languageNeeds}`);
  } else if (type === 'DHH Advocacy Rubric') {
    if (scores.rubricScore) parts.push(`Advocacy rubric score: ${scores.rubricScore}`);
    if (scores.strengths) parts.push(`Advocacy strengths: ${scores.strengths}`);
    if (scores.barriers) parts.push(`Identified barriers: ${scores.barriers}`);
    if (scores.demonstratedSkills) parts.push(`Demonstrated advocacy skills: ${scores.demonstratedSkills}`);
    if (scores.targetSkills) parts.push(`Target advocacy skills: ${scores.targetSkills}`);
  } else {
    // Informal / Other
    if (scores.freeformNotes) parts.push(scores.freeformNotes);
    if (scores.strengths) parts.push(`Strengths observed: ${scores.strengths}`);
    if (scores.accessConcerns) parts.push(`Access concerns: ${scores.accessConcerns}`);
  }

  // Common closing
  if (assessment.strengths) parts.push(`Notable strengths include: ${assessment.strengths}`);
  if (assessment.needs) parts.push(`Areas of need include: ${assessment.needs}`);
  if (assessment.implications) {
    parts.push(`Educational implications: ${assessment.implications}`);
  } else {
    parts.push(`These results provide relevant information regarding ${initials}'s auditory access and communication needs within the educational setting.`);
  }
  if (assessment.observations) parts.push(`Additional observations: ${assessment.observations}`);

  return parts.filter(Boolean).join(' ');
}

function generatePresentLevelsSummary(pl, bg, hearing, assessmentNarratives, report, pro) {
  if (!pl || !pl.areas || pl.areas.length === 0) return {};
  const initials = report.studentInitials || 'the student';
  const summary = {};

  pl.areas.forEach(area => {
    const parts = [];
    if (area === 'auditory access') {
      if (hearing?.severity) parts.push(`${initials} demonstrates auditory access consistent with a ${hearing.severity.toLowerCase()} hearing loss.`);
      const fleAssessment = assessmentNarratives.find(a => a.assessmentType === 'Functional Listening Evaluation');
      if (fleAssessment?.generatedNarrative) parts.push(`Functional listening evaluation findings further support these access patterns.`);
      if (pl.auditoryAccessNotes) parts.push(pl.auditoryAccessNotes);
    } else if (area === 'communication') {
      if (report.communicationMode) parts.push(`${initials}'s primary communication mode is ${report.communicationMode}.`);
      if (pl.communicationNotes) parts.push(pl.communicationNotes);
    } else if (area === 'academic language') {
      if (pl.academicLanguageNotes) parts.push(pl.academicLanguageNotes);
      else parts.push(`${initials} demonstrates academic language skills within the context of their communication profile and access needs.`);
    } else if (area === 'social participation') {
      if (pl.socialParticipationNotes) parts.push(pl.socialParticipationNotes);
      else parts.push(`${initials}'s participation in social and group settings is influenced by their access to communication and environmental listening conditions.`);
    } else if (area === 'advocacy skills') {
      const advocacyAssessment = assessmentNarratives.find(a => a.assessmentType === 'DHH Advocacy Rubric');
      if (advocacyAssessment?.generatedNarrative) parts.push(`Assessment data indicate ${initials}'s current self-advocacy skills.`);
      if (pl.advocacyNotes) parts.push(pl.advocacyNotes);
    } else if (area === 'technology use') {
      if (hearing?.deviceType) parts.push(`${initials} uses ${hearing.deviceType} for auditory access.`);
      if (pl.technologyNotes) parts.push(pl.technologyNotes);
    } else if (area === 'visual communication access') {
      if (pl.visualAccessNotes) parts.push(pl.visualAccessNotes);
      else parts.push(`${initials} benefits from visual supports and access strategies within the learning environment.`);
    }
    if (parts.length > 0) summary[area] = parts.join(' ');
  });

  return summary;
}

function generateAccommodationsText(accommodations, pro) {
  if (!accommodations || accommodations.length === 0) return '';
  return accommodations.map(acc => {
    if (typeof acc === 'string') return acc;
    return acc.custom || acc.name || '';
  }).filter(Boolean).join('\n');
}

function generateRecommendationsText(recommendations, report, pro) {
  if (!recommendations || recommendations.length === 0) return '';
  const initials = report.studentInitials || 'the student';
  const parts = [];
  recommendations.forEach(rec => {
    if (rec.category && rec.notes) {
      parts.push(`${rec.category}: ${rec.notes}`);
    } else if (rec.notes) {
      parts.push(rec.notes);
    }
  });
  return parts.join('\n\n');
}