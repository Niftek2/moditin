// Activity generation prompts per template type

export const TEMPLATE_LABELS = {
  AuditoryDiscrimination: "Auditory Discrimination",
  ListeningComprehension: "Listening Comprehension",
  SelfAdvocacy: "Self-Advocacy Script",
  VocabularyVisual: "Vocabulary Visual",
  FollowingDirections: "Following Directions",
  EquipmentKnowledge: "Equipment Knowledge",
};

export const TEMPLATE_DESCRIPTIONS = {
  AuditoryDiscrimination: "Minimal pairs — student identifies which word was said",
  ListeningComprehension: "Short passage with multiple choice questions",
  SelfAdvocacy: "Scenario-based: what should you say or do?",
  VocabularyVisual: "Word + image association questions",
  FollowingDirections: "Identify the correct sequence of steps",
  EquipmentKnowledge: "Hearing tech troubleshooting scenarios",
};

export const TEMPLATE_ICONS = {
  AuditoryDiscrimination: "👂",
  ListeningComprehension: "📖",
  SelfAdvocacy: "🗣️",
  VocabularyVisual: "🖼️",
  FollowingDirections: "📋",
  EquipmentKnowledge: "🦻",
};

export const PROMPT_LEVELS = ["Independent", "Repetition", "ClosedSet", "OpenSet", "VisualCue"];

export const PROMPT_LEVEL_LABELS = {
  Independent: "Independent",
  Repetition: "Repetition",
  ClosedSet: "Closed Set",
  OpenSet: "Open Set",
  VisualCue: "Visual Cue",
};

export function buildGenerationPrompt({ templateType, gradeBand, difficulty, numItems, goalText }) {
  const goalContext = goalText ? `Loosely align to this goal: "${goalText}".` : "";
  const templates = {
    AuditoryDiscrimination: `Create ${numItems} minimal pair auditory discrimination items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item shows 2-4 word choices (minimal pairs like "bat/pat" or "ship/chip"). The correct answer is one of the choices. Keep it age-appropriate. ${goalContext}`,
    ListeningComprehension: `Create ${numItems} listening comprehension items for a DHH student in grade band ${gradeBand} at ${difficulty} level. First, create a passage (2-3 paragraphs) on an age-appropriate topic. Then create ${numItems} comprehension questions based on that passage. Each item has a question as the questionText and 3-4 multiple choice answers. ${goalContext}`,
    SelfAdvocacy: `Create ${numItems} self-advocacy scenario items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item is a real-life scenario (e.g., "The teacher is talking and your hearing aid whistles. What do you do?") with 3 response options. ${goalContext}`,
    VocabularyVisual: `Create ${numItems} vocabulary items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item asks about the meaning or use of a word with 3-4 choices. Keep words age-appropriate and academically relevant. ${goalContext}`,
    FollowingDirections: `Create ${numItems} following directions items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item gives 3-4 steps out of order and asks which is the correct sequence, or asks a comprehension question about a direction. ${goalContext}`,
    EquipmentKnowledge: `Create ${numItems} hearing equipment knowledge items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item is a "What do you do if..." scenario about hearing aids, CIs, or FM systems, with 3 answer choices. ${goalContext}`,
  };

  return `You are an expert Teacher of the Deaf and Hard of Hearing (TODHH). ${templates[templateType]}

Return exactly one JSON object with the following structure:
{
  "teacherDirections": "Clear, visual instructions for the teacher on how to deliver this activity. Include pacing, prompting strategies, and accommodations. Use emoji/symbols to break up sections (🎯 Objective, 👂 How to Deliver, 💡 Tips, etc.)",
  "studentDirections": "Clear, simple directions for the student on what they will do. Use emoji/symbols to make it visual and easy to follow. Use simple language and encouraging tone.",
  "passage": "For ListeningComprehension: the 2-3 paragraph passage. For other types: null or omit.",
  "items": [
    {
      "questionText": "the question or scenario (keep it clear and concise)",
      "answerChoices": ["option1", "option2", "option3"],
      "correctAnswer": "must exactly match one of the answerChoices"
    }
  ]
}

Make items engaging and appropriate. No student names or identifying info.`;
}