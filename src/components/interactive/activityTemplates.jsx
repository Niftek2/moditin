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

export function buildGenerationPrompt({ templateType, gradeBand, difficulty, numItems, goalText, languageLevel }) {
  const goalContext = goalText ? `Loosely align to this goal: "${goalText}".` : "";
  const languageNote = languageLevel === "Simplified" ? "Use very simple words and short sentences." : languageLevel === "Advanced" ? "Use grade-level academic vocabulary." : "Use age-appropriate vocabulary.";
  
  const templates = {
    AuditoryDiscrimination: `Create ${numItems} visual minimal pair auditory discrimination items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item presents a minimal pair (like "bat/pat") as TWO IMAGES/OBJECTS plus the spoken words. For each item: include a description of what clipart/images to show (e.g., "show a picture of a bat and a pat of butter"), the two words to compare, and which is correct. ${languageNote} ${goalContext}`,
    ListeningComprehension: `Create ${numItems} HIGHLY VISUAL listening comprehension items for a DHH student in grade band ${gradeBand} at ${difficulty} level. First, create a SHORT, SIMPLE 2-3 sentence passage on a visual topic (animals, food, playground, weather, etc.). For EACH comprehension item: (1) include a clipartDescription of a relevant image to display, (2) ask a simple visual/factual question about the passage, (3) provide 3-4 picture-based answer choices (describe the images). Emphasize visuals over text. ${languageNote} ${goalContext}`,
    SelfAdvocacy: `Create ${numItems} self-advocacy scenario items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item must: (1) have a "questionText" that describes a realistic, child-appropriate scenario related to hearing loss, deafness, or hearing technology — written as a full situation the student can relate to (e.g., "You are sitting in the back of the classroom and your hearing aid battery dies. Your teacher is giving important instructions. What should you do?"), (2) provide exactly 3 answer choices — one clearly correct self-advocacy response and two plausible but less ideal responses. The correct answer should model positive, independent self-advocacy behavior. Answer choices should be full sentences. Do NOT include any clipartDescription or image references — this is text only. ${languageNote} ${goalContext}`,
    VocabularyVisual: `Create ${numItems} VISUAL vocabulary items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item: (1) shows ONE main image of a concrete object/action (clipartDescription), (2) asks "What is this?" or "What does this word mean?", (3) provides 3-4 answer choices with icons/clipart for each (clipartDescription for each choice). Focus on concrete, picturable vocabulary. ${languageNote} ${goalContext}`,
    FollowingDirections: `Create ${numItems} VISUAL following directions items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item: (1) presents 3-4 PICTURE SEQUENCES showing steps in order, (2) shows them OUT OF ORDER and asks the student to identify the correct sequence, OR asks a simple question about the picture sequence (e.g., "What comes first?"), (3) each answer choice has a clipartDescription. Use simple, concrete actions. ${languageNote} ${goalContext}`,
    EquipmentKnowledge: `Create ${numItems} VISUAL equipment knowledge items for a DHH student in grade band ${gradeBand} at ${difficulty} level. Each item: (1) shows an image of a hearing device issue (clipartDescription), (2) asks "What should you do?", (3) provides 3 picture-supported answer choices with clipart descriptions showing the correct action. Make scenarios visual and solution-focused. ${languageNote} ${goalContext}`,
  };

  return `You are an expert Teacher of the Deaf and Hard of Hearing (TODHH) creating highly VISUAL, image-based activities. ${templates[templateType]}

Return exactly one JSON object with the following structure:
{
  "teacherDirections": "Brief visual instructions for delivering this PICTURE-BASED activity. Include: 🎯 What to do, 👂 How to deliver with visuals, 💡 Accommodation tips. Emphasize showing images and visual supports.",
  "studentDirections": "Simple, 1-2 sentence directions using emoji and visuals. Example: '👀 Look at the pictures. 👂 Listen. 🖐️ Point to the right one.' Keep text minimal.",
  "passage": "For ListeningComprehension only: a SHORT (2-3 sentences max) passage about a visual topic. For other types: null or omit.",
  "items": [
    {
      "questionText": "Simple, SHORT question (keep under 10 words if possible). Refer to the images/visuals.",
      "answerChoices": ["visual option 1", "visual option 2", "visual option 3"],
      "correctAnswer": "must exactly match one of the answerChoices",
      "clipartDescription": "IMPORTANT: Describe the main visual/image for this item (e.g., 'colorful picture of a cat sleeping', 'two images side-by-side: a bat and a ball')"
    }
  ]
}

CRITICAL: Make this activity VISUAL FIRST. Minimize text. Every item should be picture-based or scenario-based with image support. Include clipartDescriptions for EVERY item. No student names or identifying info.`;
}