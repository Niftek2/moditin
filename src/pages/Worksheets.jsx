import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Sparkles, Loader2, Download, Clock } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import AIDisclaimer from "../components/shared/AIDisclaimer";
import WorksheetHistory from "../components/worksheets/WorksheetHistory";
import TeacherPrompt from "../components/worksheets/TeacherPrompt";
import ReadAloudButton from "../components/shared/ReadAloudButton";

const TEMPLATES = [
  { value: "auditory_comprehension", label: "Auditory Comprehension" },
  { value: "self_advocacy_scripts", label: "Self-Advocacy Scripts" },
  { value: "minimal_pair_listening", label: "Minimal Pair Listening Check" },
  { value: "vocabulary_visual", label: "Vocabulary with Visual Prompts" },
  { value: "listening_recall", label: "Listening Recall Organizer" },
];

export default function WorksheetsPage() {
  const [template, setTemplate] = useState("");
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [languageLevel, setLanguageLevel] = useState("Standard");
  const [loading, setLoading] = useState(false);
  const [worksheetContent, setWorksheetContent] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  const { data: audioSettings } = useQuery({
    queryKey: ['userAudioSettings'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.id) return null;
        const settings = await base44.entities.UserAudioSettings.filter({ userId: user.id });
        return settings?.[0] || null;
      } catch {
        return null;
      }
    },
  });

  const getTeacherPromptInstructions = () => {
    const baseInstructions = {
      auditory_comprehension: "Create a teacher prompt that includes: (1) a detailed passage (2-3 paragraphs) on the topic that the teacher should read aloud to students, (2) clear instructions on how to read it (pace, repetition, etc.), (3) listening strategy tips.",
      self_advocacy_scripts: "Create a teacher prompt with conversation scripts and role-play scenarios related to the topic. Include tips on how to facilitate peer practice and model confident self-advocacy.",
      minimal_pair_listening: "Create a teacher prompt explaining how to deliver the minimal pairs, including pronunciation guidance, demonstration techniques, and how to support students with different listening levels.",
      vocabulary_visual: "Create a teacher prompt with suggested visual supports, demonstration techniques, and strategies for presenting the vocabulary terms effectively.",
      listening_recall: "Create a teacher prompt with suggestions for how to present the listening materials, tips for memory support, and strategies for students to organize their recall.",
    };
    return baseInstructions[template] || "Create a brief teacher prompt with instructions on how to use this worksheet.";
  };

  const handleGenerate = async () => {
    setLoading(true);
    const selectedTemplate = TEMPLATES.find(t => t.value === template);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert TODHH educator creating a printable worksheet. 
Template type: ${selectedTemplate?.label}
Topic: ${topic}
Grade level: ${gradeLevel}
Language Level: ${languageLevel}

Create worksheet content suitable for a PDF. The worksheet should be clean, educational, and visually engaging.
Include a title, clear instructions, and 8-12 items/questions appropriate for the template type.
DO NOT include any student identifying information.

VISUAL & LANGUAGE REQUIREMENTS:
- For each item, include a "clipartDescription" field with a brief description of relevant cartoon/child-appropriate clipart (e.g., "happy sun illustration", "colorful animal stickers")
- Make the worksheet colorful and visual with clipart suggestions throughout
- Adjust language complexity based on level: ${languageLevel === "Simplified" ? "use very simple vocabulary, short sentences, high-frequency words only" : languageLevel === "Standard" ? "use age-appropriate vocabulary and sentence length" : "use grade-level vocabulary with more complex sentence structures"}

${getTeacherPromptInstructions()}

Return JSON with: title, instructions, items (array of objects with 'prompt', optional 'choices' array, and 'clipartDescription'), footerNote, teacherPrompt (string with detailed teacher instructions for delivering this worksheet).`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          instructions: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                choices: { type: "array", items: { type: "string" } },
                clipartDescription: { type: "string", description: "Description of cartoon clipart to include with this item" },
              },
            },
          },
          footerNote: { type: "string" },
          teacherPrompt: { type: "string" },
        },
      },
    });
    // Generate AI images for each item
    const itemsWithImages = await Promise.all(result.items.map(async (item) => {
      if (item.clipartDescription) {
        try {
          const imageResult = await base44.integrations.Core.GenerateImage({
            prompt: `Child-friendly colorful cartoon illustration: ${item.clipartDescription}. Simple, clean, educational clipart style.`
          });
          return { ...item, imageUrl: imageResult.url };
        } catch {
          return item;
        }
      }
      return item;
    }));

    const finalContent = { ...result, items: itemsWithImages };
    setWorksheetContent(finalContent);

    // Save to history
    await base44.entities.WorksheetLog.create({
      templateType: template,
      topic,
      gradeLevel,
      languageLevel,
      title: finalContent.title,
      worksheetContent: finalContent,
      generatedDate: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["worksheetLogs"] });
    setLoading(false);
  };

  const handleLoadFromHistory = (content) => {
    setWorksheetContent(content);
    setShowHistory(false);
  };

  return (
    <div>
      <PageHeader title="Worksheets" subtitle="Generate printable PDF worksheets" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Config & History */}
        <div className="space-y-4">
        <div className="modal-card p-5 space-y-4">
          <h3 className="font-semibold text-[var(--modal-text)] text-sm">Worksheet Setup</h3>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text-muted)]">Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"><SelectValue placeholder="Select template" /></SelectTrigger>
              <SelectContent>
                {TEMPLATES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text-muted)]">Topic / Theme</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" placeholder="e.g., Animals, Weather, School" />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text-muted)]">Grade Level</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>
                {["PK", "K", "1-2", "3-5", "6-8", "9-12"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text-muted)]">Language Level</Label>
            <Select value={languageLevel} onValueChange={setLanguageLevel}>
              <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Simplified">Simplified</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={!template || !topic || loading} className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Worksheet
          </Button>
          <AIDisclaimer compact />
        </div>

        {/* History */}
        <div className="modal-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[var(--modal-text)]" />
            <h3 className="font-semibold text-[var(--modal-text)] text-sm">Generated Worksheets</h3>
          </div>
          <WorksheetHistory onLoadWorksheet={handleLoadFromHistory} />
        </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          {worksheetContent ? (
            <div className="bg-white rounded-2xl p-8 text-gray-900 print:shadow-none" id="worksheet-preview">
              {/* Purple header bar */}
              <div className="bg-[#400070] text-white rounded-xl p-4 mb-6">
                <h1 className="text-xl font-bold">{worksheetContent.title}</h1>
              </div>

              {worksheetContent.teacherPrompt && (
                <TeacherPrompt prompt={worksheetContent.teacherPrompt} templateType={template} />
              )}

              <div className="flex items-start justify-between gap-2 mb-6">
                <p className="text-sm text-gray-600 italic flex-1">{worksheetContent.instructions}</p>
                {audioSettings?.enabled && <ReadAloudButton text={worksheetContent.instructions} rate={audioSettings.rate || 1.0} size="sm" />}
              </div>

              <div className="space-y-4">
                {worksheetContent.items?.map((item, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-4 items-start">
                        {(item.imageUrl || item.clipartDescription) && (
                          <div className="flex-shrink-0 w-24 h-24 rounded-lg border-2 border-purple-200 overflow-hidden bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.clipartDescription} className="w-full h-full object-cover" />
                            ) : (
                              <p className="text-[10px] font-medium text-purple-700 leading-tight text-center p-2">[{item.clipartDescription}]</p>
                            )}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-medium text-sm">{i + 1}. {item.prompt}</p>
                            {audioSettings?.enabled && <ReadAloudButton text={item.prompt} rate={audioSettings.rate || 1.0} size="icon" />}
                          </div>
                        {item.choices?.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {item.choices.map((c, ci) => (
                              <label key={ci} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 border border-gray-300 rounded" />
                                {c}
                              </label>
                            ))}
                          </div>
                        )}
                        {!item.choices?.length && (
                          <div className="mt-3 border-b border-gray-200 pb-4">
                            <div className="h-6 border-b border-dotted border-gray-300 mb-2" />
                            <div className="h-6 border-b border-dotted border-gray-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                <p className="text-[10px] text-gray-400">Student referenced by initials only. {worksheetContent.footerNote}</p>
                <p className="text-[10px] text-gray-400 mt-1">Modal Education · Generated {new Date().toLocaleDateString()}</p>
              </div>

              <div className="mt-4 flex justify-end print:hidden">
                <Button onClick={() => window.print()} className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2">
                  <Download className="w-4 h-4" /> Print / Save PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="modal-card p-12 text-center">
              <FileText className="w-10 h-10 text-[var(--modal-text-muted)] mx-auto mb-3" />
              <p className="text-[var(--modal-text-muted)]">Select a template and generate to preview your worksheet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}