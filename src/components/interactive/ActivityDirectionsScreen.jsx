import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Play } from "lucide-react";

export default function ActivityDirectionsScreen({ config, onStart }) {
  const { teacherDirections, studentDirections, passage, student, templateType, criticalElements, topic } = config;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--modal-text)] mb-1">Get Ready</h2>
        <p className="text-sm text-[var(--modal-text-muted)]">Review directions before starting</p>
      </div>

      {/* Teacher Directions */}
      {teacherDirections && (
        <div className="modal-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#EADDF5] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#400070]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--modal-text)]">Teacher Directions</h3>
          </div>
          <div className="text-sm text-[var(--modal-text)] whitespace-pre-wrap leading-relaxed bg-[#F7F3FA] rounded-lg p-4 border border-[#D8CDE5]">
            {teacherDirections}
          </div>
        </div>
      )}

      {/* Passage (for listening comprehension) */}
      {passage && (
        <div className="modal-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--modal-text)]">📖 Passage to Read Aloud</h3>
          </div>
          <div className="text-sm text-[var(--modal-text)] leading-relaxed bg-amber-50 rounded-lg p-4 border border-amber-200 italic">
            {passage}
          </div>
        </div>
      )}

      {/* Student Directions */}
      {studentDirections && (
        <div className="modal-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-700" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--modal-text)]">Student Directions</h3>
          </div>
          <div className="text-base text-[var(--modal-text)] whitespace-pre-wrap leading-relaxed bg-green-50 rounded-lg p-4 border border-green-200">
            {studentDirections}
          </div>
        </div>
      )}

      {/* Start Button */}
      <div className="flex justify-center">
        <Button
          onClick={onStart}
          className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2 h-12 px-8 text-base"
        >
          <Play className="w-5 h-5" /> Start Activity
        </Button>
      </div>
    </div>
  );
}