import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Clock, Volume2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ReadAloudButton from "../shared/ReadAloudButton";
import { TEMPLATE_LABELS, PROMPT_LEVELS, PROMPT_LEVEL_LABELS } from "./activityTemplates";

// ---------- Speak helper ----------
function speakText(text, rate = 1.0) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = rate;
  window.speechSynthesis.speak(utt);
}

// ---------- Auditory Discrimination Player ----------
function AuditoryDiscriminationItem({ item, current, audioRate, onSelectAnswer }) {
  const [played, setPlayed] = useState(false);
  const wordToSay = item.soundToSay || item.correctAnswer;

  const handlePlay = useCallback(() => {
    speakText(wordToSay, audioRate);
    setPlayed(true);
  }, [wordToSay, audioRate]);

  // Reset played state when item changes
  useEffect(() => { setPlayed(false); }, [item.questionText]);

  return (
    <div className="modal-card p-6 mb-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--modal-text-muted)] mb-3">Listen &amp; Click</p>

      {/* Big play button */}
      <div className="flex flex-col items-center mb-8">
        <button
          onClick={handlePlay}
          className="w-24 h-24 rounded-full bg-[#400070] hover:bg-[#5B00A0] text-white flex flex-col items-center justify-center gap-1 shadow-lg transition-all active:scale-95"
        >
          <Volume2 className="w-10 h-10" />
          <span className="text-xs font-semibold">Play</span>
        </button>
        <p className="text-xs text-[var(--modal-text-muted)] mt-3">Teacher clicks Play, then student points to the word they heard</p>
      </div>

      {/* Word choice buttons */}
      <div className="grid grid-cols-2 gap-4">
        {(item.answerChoices || []).map((choice, i) => {
          const isSelected = current.selectedAnswer === choice;
          const isCorrect = choice === item.correctAnswer;
          let cls = "p-6 rounded-2xl border-2 text-center text-2xl font-bold transition-all ";
          if (isSelected && isCorrect) cls += "border-green-400 bg-green-50 text-green-800";
          else if (isSelected && !isCorrect) cls += "border-orange-300 bg-orange-50 text-orange-800";
          else if (current.selectedAnswer && isCorrect) cls += "border-green-300 bg-green-50/50 text-green-700";
          else cls += "border-[var(--modal-border)] bg-white hover:border-[#6B2FB9] hover:bg-[#F7F3FA] text-[var(--modal-text)]";

          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <button type="button" onClick={() => onSelectAnswer(choice)} className={cls + " w-full"}>
                {choice}
              </button>
              <ReadAloudButton text={choice} rate={audioRate} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Vocabulary Visual Item ----------
function VocabularyVisualItem({ item, current, audioRate, onSelectAnswer }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = item.questionImageUrl || item.imageUrl;

  return (
    <div className="modal-card p-6 mb-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--modal-text-muted)]">Vocabulary</p>
        <ReadAloudButton text={item.questionText} rate={audioRate} size="sm" />
      </div>

      {/* Image */}
      {imageUrl && !imgError && (
        <div className="flex justify-center mb-4">
          <img
            src={imageUrl}
            alt={item.vocabularyWord || item.correctAnswer}
            className="rounded-xl object-cover w-full max-w-xs h-44 border border-[var(--modal-border)]"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      <p className="text-xl font-semibold text-[var(--modal-text)] mb-4 text-center">{item.questionText}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(item.answerChoices || []).map((choice, i) => {
          const isSelected = current.selectedAnswer === choice;
          const isCorrect = choice === item.correctAnswer;
          let cls = "p-4 rounded-2xl border-2 text-center font-semibold transition-all ";
          if (isSelected && isCorrect) cls += "border-green-400 bg-green-50 text-green-800";
          else if (isSelected && !isCorrect) cls += "border-orange-300 bg-orange-50 text-orange-800";
          else if (current.selectedAnswer && isCorrect) cls += "border-green-300 bg-green-50/50 text-green-700";
          else cls += "border-[var(--modal-border)] bg-white hover:border-[#6B2FB9] hover:bg-[#F7F3FA] text-[var(--modal-text)]";

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => onSelectAnswer(choice)} className={cls + " w-full"}>
                {choice}
              </button>
              <ReadAloudButton text={choice} rate={audioRate} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Standard Item (Comprehension, SelfAdvocacy, FollowingDirections, Equipment) ----------
function StandardItem({ item, current, audioRate, onSelectAnswer }) {
  return (
    <div className="modal-card p-6 mb-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--modal-text-muted)]">Question</p>
        <ReadAloudButton text={item.questionText} rate={audioRate} size="sm" />
      </div>

      {/* Scenario label for equipment */}
      {item.scenario && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800 italic">
          🎧 {item.scenario}
        </div>
      )}

      <p className="text-xl font-semibold text-[var(--modal-text)] mb-6 leading-relaxed">{item.questionText}</p>

      <div className="grid grid-cols-1 gap-3">
        {(item.answerChoices || []).map((choice, i) => {
          const isSelected = current.selectedAnswer === choice;
          const isCorrect = choice === item.correctAnswer;
          let cls = "p-4 rounded-2xl border-2 text-left font-medium transition-all flex items-center gap-3 w-full ";
          if (isSelected && isCorrect) cls += "border-green-400 bg-green-50 text-green-800";
          else if (isSelected && !isCorrect) cls += "border-orange-300 bg-orange-50 text-orange-800";
          else if (current.selectedAnswer && isCorrect) cls += "border-green-300 bg-green-50/50 text-green-700";
          else cls += "border-[var(--modal-border)] bg-white hover:border-[#6B2FB9] hover:bg-[#F7F3FA] text-[var(--modal-text)]";

          return (
            <div key={i} className="flex items-center gap-2">
              <button type="button" onClick={() => onSelectAnswer(choice)} className={cls}>
                <span className="text-[var(--modal-text-muted)] text-sm font-bold min-w-[1.5rem]">{String.fromCharCode(65+i)}.</span>
                <span className="text-base leading-snug">{choice}</span>
              </button>
              <ReadAloudButton text={choice} rate={audioRate} size="icon" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Main Player ----------
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
      } catch { return null; }
    },
  });

  const audioRate = audioSettings?.rate || 1.0;

  // Normalize answerChoices to plain strings
  const extractChoiceText = (c) => {
    if (typeof c === 'string') {
      try {
        const parsed = JSON.parse(c);
        if (parsed && typeof parsed === 'object') return parsed.text || parsed.label || Object.values(parsed).join('');
        return c;
      } catch { return c; }
    }
    if (c && typeof c === 'object') return c.text || c.label || c.value || '';
    return String(c ?? '');
  };

  const normalizedItems = items.map(item => ({
    ...item,
    answerChoices: (item.answerChoices || []).map(extractChoiceText).filter(Boolean),
    correctAnswer: extractChoiceText(item.correctAnswer),
  }));

  const [responses, setResponses] = useState(
    normalizedItems.map((item, i) => ({
      itemNumber: i + 1,
      questionText: item.questionText,
      answerChoices: item.answerChoices,
      correctAnswer: item.correctAnswer,
      selectedAnswer: null,
      isCorrect: null,
      promptLevel: null,
      responseLatencySeconds: 0
    }))
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

  const handleFinish = () => onComplete(responses, Math.round(elapsed / 60));

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const progress = ((currentIdx + 1) / normalizedItems.length) * 100;

  const renderItem = () => {
    const props = { item, current, audioRate, onSelectAnswer: selectAnswer };
    if (templateType === "AuditoryDiscrimination") return <AuditoryDiscriminationItem {...props} />;
    if (templateType === "VocabularyVisual") return <VocabularyVisualItem {...props} />;
    return <StandardItem {...props} />;
  };

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

      {/* Passage for listening comprehension — shown above questions */}
      {templateType === "ListeningComprehension" && config.passage && currentIdx === 0 && (
        <div className="modal-card p-4 mb-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">📖 Story Passage</p>
            <ReadAloudButton text={config.passage} rate={audioRate} size="sm" />
          </div>
          <p className="text-sm text-amber-900 leading-relaxed italic">{config.passage}</p>
        </div>
      )}

      {renderItem()}

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