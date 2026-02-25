import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Clock, Volume2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ReadAloudButton from "../shared/ReadAloudButton";
import { TEMPLATE_LABELS, PROMPT_LEVELS, PROMPT_LEVEL_LABELS } from "./activityTemplates";

export default function ActivityPlayerScreen({ config, onComplete }) {
  const { items, student, templateType, goalText } = config;
  const [currentIdx, setCurrentIdx] = useState(0);
  
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

  // Normalize answerChoices — extract display text from string or object format
  const normalizedItems = items.map(item => ({
    ...item,
    answerChoices: (item.answerChoices || []).map(c => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object') return c.text || c.label || c.value || JSON.stringify(c);
      return String(c);
    })
  }));

  const [responses, setResponses] = useState(
    normalizedItems.map((item, i) => ({ itemNumber: i + 1, questionText: item.questionText, answerChoices: item.answerChoices, correctAnswer: item.correctAnswer, selectedAnswer: null, isCorrect: null, promptLevel: null, responseLatencySeconds: 0 }))
  );
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const current = responses[currentIdx];
  const item = normalizedItems[currentIdx];

  const selectAnswer = (choiceText) => {
    const isCorrect = choiceText === item.correctAnswer;
    setResponses(prev => {
      const updated = [...prev];
      updated[currentIdx] = { ...updated[currentIdx], selectedAnswer: choiceText, isCorrect };
      return updated;
    });
  };

  const setPromptLevel = (level) => {
    setResponses(prev => {
      const updated = [...prev];
      updated[currentIdx] = { ...updated[currentIdx], promptLevel: level };
      return updated;
    });
  };

  const canAdvance = current.selectedAnswer && current.promptLevel;

  const handleNext = () => {
    if (currentIdx < normalizedItems.length - 1) setCurrentIdx(currentIdx + 1);
    else handleFinish();
  };

  const handleFinish = () => {
    onComplete(responses, Math.round(elapsed / 60));
  };

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const progress = ((currentIdx + 1) / normalizedItems.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-[#EADDF5] text-[#400070] border-0 font-semibold">{student?.studentInitials}</Badge>
          <Badge variant="outline" className="text-[10px]">{TEMPLATE_LABELS[templateType]}</Badge>
          {goalText && <Badge variant="outline" className="text-[10px] max-w-48 truncate">{goalText.slice(0,40)}...</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-[var(--modal-text-muted)]">
            <Clock className="w-3.5 h-3.5" /> {mins}:{secs.toString().padStart(2,"0")}
          </span>
          <span className="text-sm font-semibold text-[#6B2FB9]">Item {currentIdx + 1} of {normalizedItems.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[var(--modal-border)] rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-[#6B2FB9] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Question card */}
      <div className="modal-card p-6 mb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--modal-text-muted)]">Question {currentIdx + 1}</p>
          {audioSettings?.enabled && <ReadAloudButton text={item.questionText} rate={audioSettings.rate || 1.0} size="sm" />}
        </div>
        {item.questionImageUrl && (
          <div className="mb-4 flex justify-center">
            <img src={item.questionImageUrl} alt={item.questionText} className="max-h-48 rounded-lg object-contain" />
          </div>
        )}
        <p className="text-xl font-semibold text-[var(--modal-text)] mb-6 leading-relaxed">{item.questionText}</p>

        {/* Answer buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(item.answerChoices || []).map((choiceText, i) => {
            const choiceObj = items[currentIdx]?.answerChoices?.[i];
            const choiceImageUrl = choiceObj?.imageUrl || null;
            const isSelected = current.selectedAnswer === choiceText;
            const isCorrect = choiceText === item.correctAnswer;
            let btnClass = "p-4 rounded-2xl border-2 text-left font-medium transition-all flex items-center gap-3 w-full ";
            if (isSelected && isCorrect) btnClass += "border-green-400 bg-green-50 text-green-800";
            else if (isSelected && !isCorrect) btnClass += "border-[#C4A8E8] bg-[#F7F3FA] text-[#400070]";
            else if (current.selectedAnswer && isCorrect) btnClass += "border-green-300 bg-green-50/50 text-green-700";
            else btnClass += "border-[var(--modal-border)] bg-white hover:border-[#6B2FB9] hover:bg-[#F7F3FA] text-[var(--modal-text)]";

            return (
              <div key={i} className="flex items-center gap-2">
                <button type="button" onClick={() => selectAnswer(choiceText)} className={btnClass}>
                  <span className="text-[var(--modal-text-muted)] text-sm font-bold min-w-[1.5rem]">{String.fromCharCode(65+i)}.</span>
                  {choiceImageUrl && (
                    <img src={choiceImageUrl} alt={choiceText} className="h-12 w-12 object-contain rounded-md flex-shrink-0" />
                  )}
                  <span className="text-base leading-snug">{choiceText}</span>
                </button>
                {audioSettings?.enabled && audioSettings?.speakChoices && (
                  <ReadAloudButton text={choiceText} rate={audioSettings.rate || 1.0} size="icon" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Prompt Level */}
      <div className="modal-card p-4 mb-4">
        <p className="text-xs font-bold text-[var(--modal-text-muted)] mb-2">Prompt Level <span className="text-red-400">*</span></p>
        <div className="flex flex-wrap gap-2">
          {PROMPT_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setPromptLevel(level)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                current.promptLevel === level
                  ? "bg-[#400070] text-white border-[#400070]"
                  : "bg-white border-[var(--modal-border)] text-[var(--modal-text)] hover:border-[#6B2FB9]"
              }`}
            >
              {PROMPT_LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        <Button
          variant="ghost"
          onClick={handleFinish}
          className="text-[var(--modal-text-muted)] text-xs hover:text-red-500"
        >
          <X className="w-3.5 h-3.5 mr-1" /> End Early
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canAdvance}
          className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-1"
        >
          {currentIdx === normalizedItems.length - 1 ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-[10px] text-[var(--modal-text-muted)] text-center mt-4">Instructional activity · Not diagnostic</p>
    </div>
  );
}