import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SNAP_DISTANCE = 80;

export default function DragDropActivity({ activityConfig, onComplete }) {
  const [labels, setLabels] = useState([]);
  const [droppedLabels, setDroppedLabels] = useState({});
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [draggedLabel, setDraggedLabel] = useState(null);

  useEffect(() => {
    // Initialize labels in random positions at bottom
    const initialLabels = activityConfig.labels.map((label, idx) => ({
      ...label,
      tempId: `label-${idx}`,
      x: Math.random() * 60 - 30,
      y: 0,
    }));
    setLabels(initialLabels);
  }, [activityConfig]);

  const checkProximity = (x, y, targetPos) => {
    const rect = document.querySelector("[data-drop-zones]");
    if (!rect) return false;
    
    const targetX = parseInt(targetPos.right || targetPos.left || 0);
    const targetY = parseInt(targetPos.top || targetPos.bottom || 0);
    
    return Math.abs(x - targetX) < SNAP_DISTANCE && Math.abs(y - targetY) < SNAP_DISTANCE;
  };

  const handleDragEnd = (tempId, label, finalX, finalY) => {
    const isCorrect = checkProximity(finalX, finalY, label.correctPosition);

    if (isCorrect) {
      setDroppedLabels(prev => ({ ...prev, [label.id]: true }));
    } else {
      setIncorrectAttempts(prev => prev + 1);
    }

    setDraggedLabel(null);
  };

  const isComplete = Object.keys(droppedLabels).length === activityConfig.labels.length;

  useEffect(() => {
    if (isComplete) {
      const duration = (Date.now() - startTime) / 1000;
      setTimeout(() => {
        onComplete({
          activityType: activityConfig.id,
          correctLabels: Object.keys(droppedLabels).length,
          totalLabels: activityConfig.labels.length,
          incorrectAttempts,
          durationSeconds: Math.round(duration),
        });
      }, 600);
    }
  }, [isComplete, incorrectAttempts, startTime, activityConfig, droppedLabels, onComplete]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#400070] to-[#6B2FB9] text-white p-4 rounded-t-2xl">
        <h2 className="text-2xl font-bold text-center">{activityConfig.title}</h2>
      </div>

      {/* Instructions */}
      <div className="bg-[var(--modal-bg)] px-4 py-3 text-center border-b border-[var(--modal-border)]">
        <p className="text-[var(--modal-text-muted)] text-sm">Drag each label to the appropriate box.</p>
      </div>

      {/* Activity Area */}
      <div className="flex-1 relative overflow-hidden bg-white p-4 sm:p-8" data-drop-zones>
        {/* Device Image */}
        <div className="flex items-center justify-center h-full min-h-96">
          {activityConfig.id === "hearingAid" ? (
            <svg viewBox="0 0 400 500" className="h-full max-h-96 w-auto" role="img" aria-label="Hearing aid illustration">
              {/* Earhook */}
              <path d="M 180 50 Q 150 80 150 140" stroke="#400070" strokeWidth="12" fill="none" strokeLinecap="round" />
              {/* Main body */}
              <rect x="130" y="140" width="80" height="140" rx="15" fill="#E8D4F8" stroke="#400070" strokeWidth="3" />
              {/* Control buttons */}
              <circle cx="210" cy="160" r="12" fill="#400070" />
              <circle cx="210" cy="190" r="12" fill="#400070" />
              <circle cx="210" cy="220" r="12" fill="#400070" />
              {/* Microphone opening */}
              <ellipse cx="160" cy="280" rx="15" ry="20" fill="#A0A0A0" stroke="#400070" strokeWidth="2" />
              {/* Earmold */}
              <path d="M 170 280 Q 165 320 160 350 Q 158 365 165 370 Q 172 365 170 350 Q 175 320 180 280" fill="#E8D4F8" stroke="#400070" strokeWidth="3" />
              {/* Battery compartment */}
              <rect x="140" y="400" width="50" height="60" rx="8" fill="#D4C5E8" stroke="#400070" strokeWidth="2" />
              <line x1="140" y1="420" x2="190" y2="420" stroke="#400070" strokeWidth="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 400 500" className="h-full max-h-96 w-auto" role="img" aria-label="Cochlear implant illustration">
              {/* Coil magnet */}
              <circle cx="320" cy="60" r="35" fill="#E8D4F8" stroke="#400070" strokeWidth="3" />
              <circle cx="320" cy="60" r="20" fill="#400070" />
              {/* Control buttons on coil */}
              <circle cx="310" cy="75" r="6" fill="white" />
              <circle cx="330" cy="75" r="6" fill="white" />
              {/* Processor body */}
              <rect x="260" y="120" width="120" height="160" rx="20" fill="#E8D4F8" stroke="#400070" strokeWidth="3" />
              {/* Microphone */}
              <ellipse cx="280" cy="155" rx="12" ry="18" fill="#A0A0A0" stroke="#400070" strokeWidth="2" />
              {/* Control buttons on processor */}
              <circle cx="310" cy="155" r="10" fill="#400070" />
              <circle cx="310" cy="185" r="10" fill="#400070" />
              <circle cx="310" cy="215" r="10" fill="#400070" />
              {/* LED indicator */}
              <circle cx="290" cy="245" r="8" fill="#00FF00" stroke="#400070" strokeWidth="2" />
              {/* Cable/connector */}
              <path d="M 310 280 Q 300 320 290 360" stroke="#400070" strokeWidth="8" fill="none" strokeLinecap="round" />
              {/* Battery pack */}
              <rect x="250" y="380" width="60" height="80" rx="10" fill="#D4C5E8" stroke="#400070" strokeWidth="2" />
              <line x1="250" y1="410" x2="310" y2="410" stroke="#400070" strokeWidth="1" />
              <line x1="250" y1="440" x2="310" y2="440" stroke="#400070" strokeWidth="1" />
            </svg>
          )}
        </div>

        {/* Draggable Labels */}
        {labels.map(label => (
          <motion.button
            key={label.tempId}
            drag
            dragMomentum={false}
            onDragEnd={(event, info) => {
              handleDragEnd(label.tempId, label, info.x, info.y);
            }}
            onMouseEnter={() => setDraggedLabel(label.tempId)}
            onMouseLeave={() => setDraggedLabel(null)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: droppedLabels[label.id] ? 0.5 : 1 }}
            className={`
              absolute min-h-[44px] px-4 py-2 rounded-2xl font-semibold text-sm
              border-2 border-[#400070] bg-white text-[#400070]
              cursor-grab active:cursor-grabbing select-none
              transition-all touch-none
              ${draggedLabel === label.tempId ? "shadow-lg z-50" : ""}
              ${droppedLabels[label.id] ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}
            `}
            style={{
              bottom: "1rem",
              left: `${label.x}%`,
            }}
            disabled={droppedLabels[label.id]}
          >
            {label.name}
          </motion.button>
        ))}

        {/* Completion Overlay */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl p-6 text-center shadow-2xl">
              <p className="text-2xl font-bold text-green-600">Perfect!</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-[var(--modal-bg)] px-4 py-3 border-t border-[var(--modal-border)]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[var(--modal-text)]">
            Progress: {Object.keys(droppedLabels).length} / {activityConfig.labels.length}
          </p>
          {incorrectAttempts > 0 && (
            <p className="text-xs text-[var(--modal-text-muted)]">Attempts: {incorrectAttempts}</p>
          )}
        </div>
        <div className="w-full bg-[var(--modal-border)] rounded-full h-2">
          <div
            className="bg-[#400070] h-2 rounded-full transition-all"
            style={{ width: `${(Object.keys(droppedLabels).length / activityConfig.labels.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}