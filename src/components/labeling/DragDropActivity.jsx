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
        {/* Device Image Placeholder */}
        <div className="flex items-center justify-center h-full min-h-96">
          <div className="text-center space-y-4">
            <p className="text-[var(--modal-text-muted)]">Device illustration will display here</p>
            <p className="text-xs text-[var(--modal-text-muted)]">{activityConfig.labels.length} labels to place</p>
          </div>
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