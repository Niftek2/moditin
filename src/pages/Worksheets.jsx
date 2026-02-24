import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Sparkles, Loader2, Download, Clock } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import AIDisclaimer from "../components/shared/AIDisclaimer";
import WorksheetHistory from "../components/worksheets/WorksheetHistory";

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
  const [loading, setLoading] = useState(false);
  const [worksheetContent, setWorksheetContent] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    setLoading(true);
    const selectedTemplate = TEMPLATES.find(t => t.value === template);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert TODHH educator creating a printable worksheet. 
Template type: ${selectedTemplate?.label}
Topic: ${topic}
Grade level: ${gradeLevel}

Create worksheet content suitable for a PDF. The worksheet should be clean, educational, and engaging.
Include a title, clear instructions, and 8-12 items/questions appropriate for the template type.
DO NOT include any student identifying information.

Return JSON with: title, instructions, items (array of objects with 'prompt' and optionally 'choices' array), footerNote.`,
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
              },
            },
          },
          footerNote: { type: "string" },
        },
      },
    });
    setWorksheetContent(result);
    // Save to history
    await base44.entities.WorksheetLog.create({
      templateType: template,
      topic,
      gradeLevel,
      title: result.title,
      worksheetContent: result,
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

              <p className="text-sm mb-6 text-gray-600 italic">{worksheetContent.instructions}</p>

              <div className="space-y-4">
                {worksheetContent.items?.map((item, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-sm">{i + 1}. {item.prompt}</p>
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