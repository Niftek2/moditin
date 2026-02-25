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
      <div className="bg-gradient-to-r from-[#400070] to-[#6B2FB9] text-white p-3 sm:p-4 rounded-t-2xl">
        <h2 className="text-xl sm:text-2xl font-bold text-center">{activityConfig.title}</h2>
      </div>

      {/* Instructions */}
      <div className="bg-[var(--modal-bg)] px-4 py-2 sm:py-3 text-center border-b border-[var(--modal-border)]">
        <p className="text-[var(--modal-text-muted)] text-xs sm:text-sm">Drag each label to the appropriate box.</p>
      </div>

      {/* Device Image Area */}
      <div className="flex-1 overflow-auto bg-white flex items-center justify-center p-3 sm:p-6" data-drop-zones>
        <img
          src={activityConfig.imageUrl}
          alt={activityConfig.title}
          className="max-w-full max-h-full w-auto h-auto object-contain"
        />
        
        {/* Completion Overlay */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-t-2xl"
          >
            <div className="bg-white rounded-2xl p-6 text-center shadow-2xl">
              <p className="text-2xl font-bold text-green-600">Perfect!</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Draggable Labels Area */}
      <div className="relative min-h-32 sm:min-h-40 bg-[var(--modal-bg)] p-3 sm:p-4 border-t border-[var(--modal-border)] overflow-hidden">
        <p className="text-xs sm:text-sm text-[var(--modal-text-muted)] font-semibold mb-2">Drag labels here:</p>
        
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
            animate={{ opacity: droppedLabels[label.id] ? 0.3 : 1, y: 0 }}
            className={`
              absolute min-h-[40px] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm
              border-2 border-[#400070] bg-white text-[#400070]
              cursor-grab active:cursor-grabbing select-none
              transition-all touch-none whitespace-nowrap
              ${draggedLabel === label.tempId ? "shadow-lg z-50 scale-105" : ""}
              ${droppedLabels[label.id] ? "opacity-30 cursor-not-allowed" : "hover:shadow-md hover:scale-102"}
            `}
            style={{
              bottom: "0.75rem",
              left: `${label.x}%`,
            }}
            disabled={droppedLabels[label.id]}
          >
            {label.name}
          </motion.button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-3 sm:px-4 py-2 sm:py-3 border-t border-[var(--modal-border)] rounded-b-2xl">
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