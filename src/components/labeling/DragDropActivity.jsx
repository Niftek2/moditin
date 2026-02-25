import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const SNAP_DISTANCE = 80;

export default function DragDropActivity({ activityConfig, onComplete }) {
  const [labels, setLabels] = useState([]);
  const [droppedLabels, setDroppedLabels] = useState({});
  const [labelStatus, setLabelStatus] = useState({});
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

  const checkProximity = (dragX, dragY, targetPos) => {
    const imageContainer = document.querySelector("[data-drop-zones]");
    if (!imageContainer) return false;

    const containerRect = imageContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate target position in pixels
    let targetPixelX, targetPixelY;
    
    if (targetPos.left) {
      targetPixelX = (parseFloat(targetPos.left) / 100) * containerWidth;
    } else if (targetPos.right) {
      targetPixelX = containerWidth - (parseFloat(targetPos.right) / 100) * containerWidth;
    }
    
    if (targetPos.top) {
      targetPixelY = (parseFloat(targetPos.top) / 100) * containerHeight;
    } else if (targetPos.bottom) {
      targetPixelY = containerHeight - (parseFloat(targetPos.bottom) / 100) * containerHeight;
    }

    // Convert drag coordinates to be relative to image container
    const dragPixelX = dragX - containerRect.left;
    const dragPixelY = dragY - containerRect.top;

    // Check if within snap distance
    return (
      Math.abs(dragPixelX - targetPixelX) < SNAP_DISTANCE && 
      Math.abs(dragPixelY - targetPixelY) < SNAP_DISTANCE
    );
  };

  const handleDragEnd = (tempId, label, finalX, finalY) => {
    const isCorrect = checkProximity(finalX, finalY, label.correctPosition);

    if (isCorrect) {
      setDroppedLabels(prev => ({ ...prev, [label.id]: true }));
      setLabelStatus(prev => ({ ...prev, [label.id]: 'correct' }));
    } else {
      setIncorrectAttempts(prev => prev + 1);
      setLabelStatus(prev => ({ ...prev, [label.id]: 'incorrect' }));
      // Clear incorrect status after 1 second so they can try again
      setTimeout(() => {
        setLabelStatus(prev => {
          const updated = { ...prev };
          delete updated[label.id];
          return updated;
        });
      }, 1000);
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
        <p className="text-[var(--modal-text-muted)] text-xs sm:text-sm">Drag each label to the appropriate box on the image.</p>
      </div>

      {/* Main Activity Area */}
      <div className="flex-1 flex flex-col gap-4 p-3 sm:p-6 bg-[var(--modal-bg)] overflow-auto">
        {/* Image with Drop Zones */}
        <div className="relative flex-1 bg-white rounded-xl overflow-hidden flex items-center justify-center">
          <img
            src={activityConfig.imageUrl}
            alt={activityConfig.title}
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />
          
          {/* Drop Zone Indicators (invisible targets) */}
          {activityConfig.labels.map(label => (
            <div
              key={`zone-${label.id}`}
              className="absolute pointer-events-none"
              style={{
                ...label.correctPosition,
                width: "120px",
                height: "50px",
              }}
            />
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

        {/* Draggable Labels Bank */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[var(--modal-border)]">
        <p className="text-xs sm:text-sm text-[var(--modal-text-muted)] font-semibold mb-3">Drag labels onto the image:</p>
        <div className="flex flex-wrap gap-2">
          {labels.map(label => (
            <div key={label.tempId} className="relative">
              <motion.button
                drag
                dragMomentum={false}
                onDragEnd={(event, info) => {
                  handleDragEnd(label.tempId, label, info.x, info.y);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: droppedLabels[label.id] ? 0.3 : 1 }}
                className={`
                  min-h-[40px] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm
                  border-2 cursor-grab active:cursor-grabbing select-none
                  transition-all touch-none
                  ${droppedLabels[label.id] 
                    ? "opacity-30 cursor-not-allowed border-green-500 bg-green-50 text-green-700" 
                    : labelStatus[label.id] === 'incorrect'
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-[#400070] bg-white text-[#400070] hover:shadow-md"
                  }
                `}
                disabled={droppedLabels[label.id]}
              >
                {label.name}
              </motion.button>

              {/* Feedback Icon */}
              {droppedLabels[label.id] && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
              {labelStatus[label.id] === 'incorrect' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                >
                  <X className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-3 border-2 border-[var(--modal-border)]">
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
    </div>
  );
}