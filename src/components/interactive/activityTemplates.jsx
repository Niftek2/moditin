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
  AuditoryDiscrimination: "Teacher says a word — student clicks the matching word",
  ListeningComprehension: "Story read aloud, then comprehension questions",
  SelfAdvocacy: "Scenario-based: what should you say or do?",
  VocabularyVisual: "Vocabulary word + image matching by theme",
  FollowingDirections: "Multi-step directions with critical elements",
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

// Which templates support a topic/theme field
export const TEMPLATE_SUPPORTS_TOPIC = {
  AuditoryDiscrimination: false,
  ListeningComprehension: true,
  SelfAdvocacy: false,
  VocabularyVisual: true,
  FollowingDirections: false,
  EquipmentKnowledge: false,
};

// Which templates support critical elements selector
export const TEMPLATE_SUPPORTS_CRITICAL_ELEMENTS = {
  FollowingDirections: true,
};

export const PROMPT_LEVELS = ["Independent", "Repetition", "ClosedSet", "OpenSet", "VisualCue"];

export const PROMPT_LEVEL_LABELS = {
  Independent: "Independent",
  Repetition: "Repetition",
  ClosedSet: "Closed Set",
  OpenSet: "Open Set",
  VisualCue: "Visual Cue",
};

export function buildGenerationPrompt({ templateType, gradeBand, difficulty, numItems, goalText, languageLevel, topic, criticalElements }) {
  const goalContext = goalText ? `Loosely align to this goal: "${goalText}".` : "";
  const languageNote = languageLevel === "Simplified"
    ? "Use very simple words and short sentences appropriate for young children."
    : languageLevel === "Advanced"
    ? "Use grade-level academic vocabulary."
    : "Use age-appropriate vocabulary.";

  const topicNote = topic ? `Theme/topic: "${topic}".` : "";

  const templates = {
    AuditoryDiscrimination: `Create ${numItems} auditory discrimination minimal pair items for a DHH student in grade band ${gradeBand} at ${difficulty} level. 
Each item presents TWO words that sound similar (minimal pairs, e.g. "bat/pat", "ship/chip", "bear/pear", "coat/goat", "ten/hen"). 
For each item provide: 
- "questionText": a short teacher instruction like "Listen. Which word did you hear?" 
- "soundToSay": the word the teacher will SAY ALOUD (this is the correct answer) 
- "answerChoices": exactly TWO words — the correct word and one foil that sounds similar 
- "correctAnswer": must exactly match the soundToSay 
Make minimal pairs appropriate for grade band ${gradeBand}. ${languageNote} ${goalContext}`,

    ListeningComprehension: `Create a listening comprehension activity for a DHH student in grade band ${gradeBand} at ${difficulty} level. ${topicNote}
First create a short, engaging story/passage (4-6 sentences for lower grades, 6-8 sentences for upper grades) about the topic. The passage should be narrative or descriptive, child-appropriate, and interesting.
Then create ${numItems} comprehension questions about the passage.
For each question:
- "questionText": a clear comprehension question (literal or inferential depending on difficulty)
- "answerChoices": exactly 3 choices (strings)
- "correctAnswer": must exactly match one of the choices
${languageNote} ${goalContext}`,

    SelfAdvocacy: `Create ${numItems} self-advocacy scenario items for a DHH student in grade band ${gradeBand} at ${difficulty} level. 
Each item must:
1. Have a "questionText" that describes a realistic, child-appropriate scenario related to hearing loss, deafness, or hearing technology — written as a full situation the student can relate to (e.g., "You are sitting in the back of the classroom and your hearing aid battery dies. Your teacher is giving important instructions. What should you do?")
2. Provide exactly 3 answer choices — one clearly correct self-advocacy response and two plausible but less ideal responses. The correct answer should model positive, independent self-advocacy behavior. Answer choices should be full sentences.
Do NOT include any image references. ${languageNote} ${goalContext}`,

    VocabularyVisual: `Create ${numItems} vocabulary items for a DHH student in grade band ${gradeBand} at ${difficulty} level. ${topicNote}
Each item focuses on ONE vocabulary word related to the theme. 
For each item:
- "questionText": ask "What is this?" or "Which picture shows [word]?" 
- "vocabularyWord": the target word (simple, concrete, picturable noun or verb)
- "imageSearchQuery": a short, specific search query to find a real photo of this word (e.g. "red apple fruit", "yellow school bus", "brown dog sitting") — must be concrete and directly visual
- "answerChoices": exactly 3 choices (the correct word + 2 similar category distractors, as plain strings)
- "correctAnswer": must exactly match the vocabularyWord
Keep vocabulary concrete and directly related to the theme. ${languageNote} ${goalContext}`,

    FollowingDirections: `Create ${numItems} following directions items for a DHH student in grade band ${gradeBand} at ${difficulty} level. 
Each direction must have exactly ${criticalElements || 2} critical elements (specific attributes the student must remember, e.g. color + object + location = 3 critical elements).
For each item:
- "questionText": a clear spoken direction with ${criticalElements || 2} critical elements, e.g. "Touch the BIG RED circle first, then point to the SMALL BLUE square." Bold the critical elements in the direction text using asterisks like *word*.
- "directionText": the full direction written out clearly (same as questionText but formatted)
- "criticalElementCount": ${criticalElements || 2}
- "answerChoices": exactly 3 options describing what the student did — one correct (followed direction perfectly), one close but missed an element, one clearly wrong
- "correctAnswer": must exactly match the correct choice
${languageNote} ${goalContext}`,

    EquipmentKnowledge: `Create ${numItems} equipment knowledge/troubleshooting scenario items for a DHH student in grade band ${gradeBand} at ${difficulty} level.
Each item presents a real situation with a hearing device problem or question.
For each item:
- "questionText": a realistic scenario a DHH student might face (e.g., "Your hearing aid is making a squealing sound. What should you do first?", "Your cochlear implant processor won't turn on. What do you check first?")
- "scenario": one sentence setting up the situation
- "answerChoices": exactly 3 choices — one correct troubleshooting step, two plausible but less effective responses
- "correctAnswer": the best action to take, must exactly match one choice
Make scenarios age-appropriate and practical. Include scenarios about: batteries, feedback/whistling, connectivity, daily checks, when to get adult help. ${languageNote} ${goalContext}`,
  };

  return `You are an expert Teacher of the Deaf and Hard of Hearing (TODHH) creating activities for students. ${templates[templateType]}

Return exactly one JSON object:
{
  "teacherDirections": "Clear instructions for the teacher on how to deliver this activity. Include delivery tips and accommodation suggestions.",
  "studentDirections": "Simple 1-2 sentence directions for the student. Keep very brief and clear.",
  "passage": ${templateType === "ListeningComprehension" ? '"The full story/passage text to be read aloud to the student."' : "null"},
  "items": [
    {
      "questionText": "...",
      "answerChoices": ["choice1", "choice2", "choice3"],
      "correctAnswer": "must exactly match one answerChoice"
    }
  ]
}

No student names or identifying info. Return only valid JSON.`;
}