import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Target, Search, Filter, ChevronDown, ChevronUp, Check, X, ShieldAlert, Sparkles, Plus, Pencil, Trash2 } from "lucide-react";
import EmptyState from "../shared/EmptyState";
import AIGoalCreator from "./AIGoalCreator";

const DOMAINS = ["Auditory Skills", "Self-Advocacy", "Speech", "Receptive Language", "Expressive Language", "Pragmatics", "Literacy Access", "Hearing Equipment Use", "Classroom Listening"];
const GRADE_BANDS = ["PK", "K", "1-2", "3-5", "6-8", "9-12"];
const BASELINE_LEVELS = ["Emerging", "Developing", "Mastering"];

export default function GoalBankModal({ open, onClose, studentId, studentData }) {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCompliance, setShowCompliance] = useState(true);
  const [showAICreator, setShowAICreator] = useState(false);
  const [showCustomGoalForm, setShowCustomGoalForm] = useState(false);
  const [customGoalForm, setCustomGoalForm] = useState({ annualGoal: "", domain: "", gradeBand: "", baselineLevel: "", measurementType: "" });
  const [editingGoal, setEditingGoal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals", currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ created_by: currentUser?.email }, "-created_date", 200),
    enabled: !!currentUser?.id,
  });

  const assignMutation = useMutation({
    mutationFn: (data) => base44.entities.StudentGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentGoals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setEditingGoal(null);
    },
  });

  const handleAISave = async (goalData) => {
    await base44.entities.Goal.create({ ...goalData, isCustom: true });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    setShowAICreator(false);
  };

  const handleCustomGoalSave = async () => {
    if (!customGoalForm.annualGoal.trim() || !customGoalForm.domain) return;
    await base44.entities.Goal.create({ ...customGoalForm, isCustom: true });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    setShowCustomGoalForm(false);
    setCustomGoalForm({ annualGoal: "", domain: "", gradeBand: "", baselineLevel: "", measurementType: "" });
  };

  const filtered = goals.filter(g => {
    const matchSearch = !search || g.annualGoal?.toLowerCase().includes(search.toLowerCase()) || g.domain?.toLowerCase().includes(search.toLowerCase());
    const matchDomain = domainFilter === "all" || g.domain === domainFilter;
    const matchGrade = gradeFilter === "all" || g.gradeBand === gradeFilter;
    return matchSearch && matchDomain && matchGrade;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-white border-[var(--modal-border)] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[var(--modal-border)] shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[var(--modal-text)] text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-[#6B2FB9]" /> Goal Bank
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCustomGoalForm(true)}
                  size="sm"
                  className="bg-white border border-[var(--modal-border)] text-[var(--modal-text)] hover:bg-[var(--modal-card-hover)] rounded-xl gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Custom
                </Button>
                <Button
                  onClick={() => setShowAICreator(true)}
                  size="sm"
                  className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-1 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Goal
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Compliance */}
            {showCompliance && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 flex-1">
                  <strong>Reminder:</strong> Goals are starting points only. Review all goals to ensure they meet your district and state requirements before adding to any IEP.
                </p>
                <button onClick={() => setShowCompliance(false)} className="shrink-0 text-amber-400 hover:text-amber-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--modal-text-muted)]" />
                  <Input
                    placeholder="Search goals..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white border-[var(--modal-border)] text-[var(--modal-text)]"
                  />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-[var(--modal-border)] text-[var(--modal-text-muted)] gap-2 text-xs">
                  <Filter className="w-3.5 h-3.5" /> Filters
                </Button>
              </div>
              {showFilters && (
                <div className="flex flex-wrap gap-2 bg-[#F7F3FA] p-3 rounded-xl">
                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="w-44 bg-white border-[var(--modal-border)] text-[var(--modal-text)] text-xs h-9">
                      <SelectValue placeholder="Domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-28 bg-white border-[var(--modal-border)] text-[var(--modal-text)] text-xs h-9">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {GRADE_BANDS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--modal-text-muted)]">{filtered.length} goal{filtered.length !== 1 ? "s" : ""} found</p>

            {filtered.length === 0 && !isLoading ? (
              <EmptyState icon={Target} title="No goals found" description="Try adjusting your filters or create a new goal." />
            ) : (
              <div className="space-y-2">
                {filtered.map((goal) => (
                  <div key={goal.id} className="border border-[var(--modal-border)] rounded-xl overflow-hidden bg-white">
                    <div className="flex items-start gap-2 p-3">
                      <button
                        onClick={() => setExpanded(expanded === goal.id ? null : goal.id)}
                        className="flex-1 text-left"
                      >
                        <p className="text-sm text-[var(--modal-text)] leading-relaxed">{goal.annualGoal}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {goal.domain && <Badge className="text-[10px] bg-[#EADDF5] text-[#400070] border-0">{goal.domain}</Badge>}
                          {goal.gradeBand && <Badge variant="secondary" className="text-[10px] bg-[var(--modal-purple-pale)] text-[var(--modal-text)] border-0">{goal.gradeBand}</Badge>}
                          {goal.baselineLevel && <Badge variant="secondary" className="text-[10px] bg-[var(--modal-purple-pale)] text-[var(--modal-text)] border-0">{goal.baselineLevel}</Badge>}
                        </div>
                      </button>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditingGoal({ ...goal })}
                          className="p-1.5 rounded-lg text-[var(--modal-text-muted)] hover:text-[#400070] hover:bg-[#F7F3FA] transition-colors"
                          title="Edit goal"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this goal?")) deleteMutation.mutate(goal.id); }}
                          className="p-1.5 rounded-lg text-[var(--modal-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpanded(expanded === goal.id ? null : goal.id)}
                          className="p-1.5 rounded-lg text-[var(--modal-text-muted)] hover:bg-[#F7F3FA] transition-colors"
                        >
                          {expanded === goal.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {expanded === goal.id && (
                      <div className="px-3 pb-3 space-y-2 border-t border-[var(--modal-border)] pt-2 bg-[#F7F3FA]">
                        {goal.baselinePrompt && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-0.5">Baseline Prompt</p>
                            <p className="text-xs text-[var(--modal-text)]">{goal.baselinePrompt}</p>
                          </div>
                        )}
                        {goal.objectives?.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-0.5">Objectives</p>
                            <ol className="space-y-0.5">
                              {goal.objectives.map((obj, i) => (
                                <li key={i} className="text-xs text-[var(--modal-text)] flex gap-1.5">
                                  <span className="text-[#6B2FB9] font-medium">{i + 1}.</span>{obj}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {goal.progressMonitoring && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-0.5">Progress Monitoring</p>
                            <p className="text-xs text-[var(--modal-text)]">{goal.progressMonitoring}</p>
                          </div>
                        )}
                        {studentId && (
                          <Button
                            onClick={() => {
                              assignMutation.mutate({ studentId, goalId: goal.id, status: "Active", assignedDate: new Date().toISOString().split("T")[0] });
                              setExpanded(null);
                            }}
                            className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2 mt-1"
                            size="sm"
                            disabled={assignMutation.isPending}
                          >
                            <Check className="w-3.5 h-3.5" /> Assign to Student
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="bg-white border-[var(--modal-border)] max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--modal-text)]">Edit Goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-[var(--modal-text)]">Annual Goal</Label>
                <Textarea
                  value={editingGoal.annualGoal}
                  onChange={(e) => setEditingGoal(p => ({ ...p, annualGoal: e.target.value }))}
                  className="bg-white border-[var(--modal-border)] text-[var(--modal-text)] h-28"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--modal-text)]">Domain</Label>
                <Select value={editingGoal.domain || ""} onValueChange={(v) => setEditingGoal(p => ({ ...p, domain: v }))}>
                  <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[var(--modal-text)] text-xs">Grade Band</Label>
                  <Select value={editingGoal.gradeBand || ""} onValueChange={(v) => setEditingGoal(p => ({ ...p, gradeBand: v }))}>
                    <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_BANDS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--modal-text)] text-xs">Baseline Level</Label>
                  <Select value={editingGoal.baselineLevel || ""} onValueChange={(v) => setEditingGoal(p => ({ ...p, baselineLevel: v }))}>
                    <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {BASELINE_LEVELS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--modal-text)]">Baseline Prompt</Label>
                <Textarea
                  value={editingGoal.baselinePrompt || ""}
                  onChange={(e) => setEditingGoal(p => ({ ...p, baselinePrompt: e.target.value }))}
                  className="bg-white border-[var(--modal-border)] text-[var(--modal-text)] h-16"
                  placeholder="Optional baseline prompt..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingGoal(null)} className="border-[var(--modal-border)] text-[var(--modal-text)]">Cancel</Button>
                <Button
                  onClick={() => updateMutation.mutate({ id: editingGoal.id, data: { annualGoal: editingGoal.annualGoal, domain: editingGoal.domain, gradeBand: editingGoal.gradeBand, baselineLevel: editingGoal.baselineLevel, baselinePrompt: editingGoal.baselinePrompt } })}
                  className="bg-[#400070] hover:bg-[#5B00A0] text-white"
                  disabled={updateMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Goal Dialog */}
      <Dialog open={showCustomGoalForm} onOpenChange={setShowCustomGoalForm}>
        <DialogContent className="bg-white border-[var(--modal-border)] max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--modal-text)]">Create Custom Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[var(--modal-text)]">Annual Goal</Label>
              <Textarea
                placeholder="Enter the annual goal text..."
                value={customGoalForm.annualGoal}
                onChange={(e) => setCustomGoalForm(p => ({ ...p, annualGoal: e.target.value }))}
                className="bg-white border-[var(--modal-border)] text-[var(--modal-text)] h-24"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--modal-text)]">Domain</Label>
              <Select value={customGoalForm.domain} onValueChange={(v) => setCustomGoalForm(p => ({ ...p, domain: v }))}>
                <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[var(--modal-text)] text-xs">Grade Band</Label>
                <Select value={customGoalForm.gradeBand} onValueChange={(v) => setCustomGoalForm(p => ({ ...p, gradeBand: v }))}>
                  <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_BANDS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--modal-text)] text-xs">Baseline Level</Label>
                <Select value={customGoalForm.baselineLevel} onValueChange={(v) => setCustomGoalForm(p => ({ ...p, baselineLevel: v }))}>
                  <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASELINE_LEVELS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button variant="outline" onClick={() => setShowCustomGoalForm(false)} className="border-[var(--modal-border)] text-[var(--modal-text)]">Cancel</Button>
              <Button onClick={handleCustomGoalSave} className="bg-[#400070] hover:bg-[#5B00A0] text-white">Create Goal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIGoalCreator
        open={showAICreator}
        onClose={() => setShowAICreator(false)}
        onSave={handleAISave}
        studentData={studentData}
      />
    </>
  );
}