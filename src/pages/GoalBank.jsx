import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Target, Search, Filter, ChevronDown, ChevronUp, Check, X, ShieldAlert, Sparkles } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import AIGoalCreator from "../components/goalbank/AIGoalCreator";
import DeafCultureActivityGenerator from "../components/goalbank/DeafCultureActivityGenerator";

const DOMAINS = ["Auditory Skills", "Self-Advocacy", "Speech", "Receptive Language", "Expressive Language", "Pragmatics", "Literacy Access", "Hearing Equipment Use", "Classroom Listening"];
const GRADE_BANDS = ["PK", "K", "1-2", "3-5", "6-8", "9-12"];
const BASELINE_LEVELS = ["Emerging", "Developing", "Mastering"];

export default function GoalBankPage() {
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("studentId");

  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [showCompliance, setShowCompliance] = useState(true);
  const [showAICreator, setShowAICreator] = useState(false);
  const [showDeafCultureGen, setShowDeafCultureGen] = useState(false);

  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list("-created_date", 200),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const assignMutation = useMutation({
    mutationFn: (data) => base44.entities.StudentGoal.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["studentGoals"] }),
  });

  const handleAISave = async (goalData) => {
    await base44.entities.Goal.create({ ...goalData, isCustom: true });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    setShowAICreator(false);
  };

  const filtered = goals.filter(g => {
    const matchSearch = !search || g.annualGoal?.toLowerCase().includes(search.toLowerCase()) || g.domain?.toLowerCase().includes(search.toLowerCase());
    const matchDomain = domainFilter === "all" || g.domain === domainFilter;
    const matchGrade = gradeFilter === "all" || g.gradeBand === gradeFilter;
    return matchSearch && matchDomain && matchGrade;
  });

  return (
    <div>
      <PageHeader
        title="Goal Bank"
        subtitle="SMART goals for Deaf/Hard of Hearing students"
        action={
          <Button onClick={() => setShowAICreator(true)} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
            <Sparkles className="w-4 h-4" /> AI Goal Creator
          </Button>
        }
      />

      {/* Compliance reminder */}
      {showCompliance && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>Compliance reminder:</strong> Goals in this bank are starting points only. You are responsible for reviewing and ensuring all goals meet your district, school, and state/federal regulations before including them in any IEP.
          </p>
          <button onClick={() => setShowCompliance(false)} className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--modal-text-muted)]" />
            <Input
              placeholder="Search goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-[var(--modal-border)] text-white placeholder:text-[var(--modal-text-muted)]/50"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-[var(--modal-border)] text-[var(--modal-text-muted)] gap-2">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 modal-card p-4">
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-48 bg-white/5 border-[var(--modal-border)] text-white">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-32 bg-white/5 border-[var(--modal-border)] text-white">
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

      {/* Results count */}
      <p className="text-xs text-[var(--modal-text-muted)] mb-4">{filtered.length} goal{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Goals List */}
      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Target} title="No goals found" description="Try adjusting your filters or generate a new goal with AI." />
      ) : (
        <div className="space-y-3">
          {filtered.map((goal) => (
            <div key={goal.id} className="modal-card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === goal.id ? null : goal.id)}
                className="w-full p-4 text-left hover:bg-[var(--modal-card-hover)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-relaxed">{goal.annualGoal}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge className="text-[10px] bg-[#400070]/30 text-[var(--modal-purple-glow)] border-0">{goal.domain}</Badge>
                      {goal.gradeBand && <Badge variant="secondary" className="text-[10px] bg-white/10 text-[var(--modal-text-muted)] border-0">{goal.gradeBand}</Badge>}
                      {goal.baselineLevel && <Badge variant="secondary" className="text-[10px] bg-white/10 text-[var(--modal-text-muted)] border-0">{goal.baselineLevel}</Badge>}
                      {goal.measurementType && <Badge variant="secondary" className="text-[10px] bg-white/10 text-[var(--modal-text-muted)] border-0">{goal.measurementType}</Badge>}
                    </div>
                  </div>
                  {expanded === goal.id ? <ChevronUp className="w-4 h-4 text-[var(--modal-text-muted)] shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-[var(--modal-text-muted)] shrink-0 mt-1" />}
                </div>
              </button>

              {expanded === goal.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-[var(--modal-border)] pt-3">
                  {goal.baselinePrompt && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-1">Baseline Prompt</p>
                      <p className="text-sm text-[var(--modal-text)]">{goal.baselinePrompt}</p>
                    </div>
                  )}
                  {goal.objectives?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-1">Objectives</p>
                      <ol className="space-y-1">
                        {goal.objectives.map((obj, i) => (
                          <li key={i} className="text-sm text-[var(--modal-text)] flex gap-2">
                            <span className="text-[var(--modal-purple-glow)] font-medium">{i + 1}.</span>
                            {obj}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {goal.progressMonitoring && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-1">Progress Monitoring</p>
                      <p className="text-sm text-[var(--modal-text)]">{goal.progressMonitoring}</p>
                    </div>
                  )}
                  {studentId && (
                    <Button
                      onClick={() => assignMutation.mutate({ studentId, goalId: goal.id, status: "Active", assignedDate: new Date().toISOString().split("T")[0] })}
                      className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2 mt-2"
                      size="sm"
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

      <AIGoalCreator
        open={showAICreator}
        onClose={() => setShowAICreator(false)}
        onSave={handleAISave}
        studentData={studentIdToEdit ? students.find(s => s.id === studentIdToEdit) : null}
      />
    </div>
  );
}