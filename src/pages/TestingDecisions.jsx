import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TestTube2, Search, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import AIDisclaimer from "../components/shared/AIDisclaimer";

const DISCLAIMER = "This tool suggests educational next steps for consideration. It does not diagnose hearing loss or replace audiological evaluation. Follow district/state procedures and consult licensed professionals as required.";

export default function TestingDecisionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState({});
  const [wizardResult, setWizardResult] = useState(null);
  const [wizardLoading, setWizardLoading] = useState(false);

  const { data: assessments = [] } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => base44.entities.AssessmentTool.list(),
  });

  const filtered = assessments.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.primaryPurpose?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.accessType === typeFilter;
    return matchSearch && matchType;
  });

  const wizardQuestions = [
    { key: "concern", label: "What is the primary area of concern?", options: ["Auditory comprehension", "Speech production", "Language (receptive/expressive)", "Classroom listening", "Self-advocacy", "Academic access"] },
    { key: "age", label: "What is the student's approximate grade level?", options: ["PK-K", "1-3", "4-6", "7-9", "10-12"] },
    { key: "purpose", label: "What is the purpose of testing?", options: ["Initial evaluation", "Triennial reevaluation", "Progress monitoring", "Specific skill screening"] },
    { key: "setting", label: "What type of assessment is preferred?", options: ["Standardized/formal", "Informal/criterion-based", "Either/both"] },
    { key: "budget", label: "What is your assessment access?", options: ["Free screenings only", "Have access to standardized tools", "Both"] },
  ];

  const handleWizardSubmit = async () => {
    setWizardLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert TODHH assessment consultant. Based on these answers, recommend 2-4 assessment tools and explain why:
${JSON.stringify(wizardAnswers)}

Available assessments: ${assessments.map(a => a.name).join(", ")}

Return a JSON with: recommendations (array of objects with: toolName, rationale, priority from 1-3).
IMPORTANT: ${DISCLAIMER}`,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                toolName: { type: "string" },
                rationale: { type: "string" },
                priority: { type: "number" },
              },
            },
          },
        },
      },
    });
    setWizardResult(result);
    setWizardLoading(false);
  };

  return (
    <div>
      <PageHeader title="Testing Decisions" subtitle="Assessment tools and guided decision wizard" />

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-sm text-amber-700">
        {DISCLAIMER}
      </div>

      <Tabs defaultValue="library">
        <TabsList className="bg-white/5 border border-[var(--modal-border)] mb-6">
          <TabsTrigger value="library" className="data-[state=active]:bg-[#400070] data-[state=active]:text-white">Library</TabsTrigger>
          <TabsTrigger value="wizard" className="data-[state=active]:bg-[#400070] data-[state=active]:text-white">Guided Wizard</TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--modal-text-muted)]" />
              <Input placeholder="Search assessments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white border-[var(--modal-border)] text-[var(--modal-text)]" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44 bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FreeScreening">Free Screening</SelectItem>
                <SelectItem value="StandardizedPaid">Standardized (Paid)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filtered.map(tool => (
              <div key={tool.id} className="modal-card overflow-hidden">
                <button onClick={() => setExpanded(expanded === tool.id ? null : tool.id)} className="w-full p-4 text-left hover:bg-[var(--modal-card-hover)] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--modal-text)]">{tool.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className={`text-[10px] border-0 ${tool.accessType === "FreeScreening" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {tool.accessType === "FreeScreening" ? "Free" : "Standardized"}
                        </Badge>
                        {tool.typicalAgeRange && <Badge variant="secondary" className="text-[10px] bg-[var(--modal-purple-pale)] text-[var(--modal-text)] border-0">{tool.typicalAgeRange}</Badge>}
                      </div>
                    </div>
                    {expanded === tool.id ? <ChevronUp className="w-4 h-4 text-[var(--modal-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--modal-text-muted)]" />}
                  </div>
                </button>
                {expanded === tool.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[var(--modal-border)] pt-3">
                    {tool.primaryPurpose && <div><p className="text-xs font-semibold uppercase text-[var(--modal-text-muted)] mb-1">Purpose</p><p className="text-sm text-[var(--modal-text)]">{tool.primaryPurpose}</p></div>}
                    {tool.domainsMeasured?.length > 0 && <div><p className="text-xs font-semibold uppercase text-[var(--modal-text-muted)] mb-1">Domains</p><div className="flex flex-wrap gap-1 mt-1">{tool.domainsMeasured.map(d => <Badge key={d} variant="secondary" className="text-xs bg-[var(--modal-purple-pale)] text-[var(--modal-text)] border-0">{d}</Badge>)}</div></div>}
                    {tool.cautionNotes && <div><p className="text-xs font-semibold uppercase text-[var(--modal-text-muted)] mb-1">Caution</p><p className="text-sm text-amber-700">{tool.cautionNotes}</p></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wizard">
          {!wizardResult ? (
            <div className="modal-card p-6">
              {wizardStep < wizardQuestions.length ? (
                <div>
                  <p className="text-sm text-[var(--modal-text-muted)] mb-2">Question {wizardStep + 1} of {wizardQuestions.length}</p>
                  <h3 className="font-semibold mb-4 text-[var(--modal-text)]">{wizardQuestions[wizardStep].label}</h3>
                  <div className="space-y-2">
                    {wizardQuestions[wizardStep].options.map(opt => (
                      <button key={opt} onClick={() => {
                        setWizardAnswers(prev => ({ ...prev, [wizardQuestions[wizardStep].key]: opt }));
                        setWizardStep(prev => prev + 1);
                      }} className="w-full text-left p-3 rounded-xl border border-[var(--modal-border)] hover:bg-[#400070]/20 hover:border-[#400070]/50 text-sm text-[var(--modal-text)] transition-all">
                        {opt}
                      </button>
                    ))}
                  </div>
                  {wizardStep > 0 && <Button variant="ghost" onClick={() => setWizardStep(prev => prev - 1)} className="mt-4 text-[var(--modal-text-muted)]">Back</Button>}
                </div>
              ) : (
                <div className="text-center py-6">
                  <h3 className="font-semibold mb-4 text-[var(--modal-text)]">Ready to generate recommendations</h3>
                  <Button onClick={handleWizardSubmit} disabled={wizardLoading} className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2">
                    {wizardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Get Recommendations
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="modal-card p-6">
                <h3 className="font-semibold mb-4 text-[var(--modal-text)]">Recommended Assessments</h3>
                <div className="space-y-3">
                  {wizardResult.recommendations?.map((rec, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--modal-card-hover)] border border-[var(--modal-border)]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[var(--modal-text)]">{rec.toolName}</span>
                        <Badge className="text-[10px] bg-[#400070]/30 text-[var(--modal-purple-glow)] border-0">Priority {rec.priority}</Badge>
                      </div>
                      <p className="text-sm text-[var(--modal-text)]">{rec.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
              <AIDisclaimer />
              <Button variant="outline" onClick={() => { setWizardResult(null); setWizardStep(0); setWizardAnswers({}); }} className="border-[var(--modal-border)] text-[var(--modal-text-muted)]">
                Start Over
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}