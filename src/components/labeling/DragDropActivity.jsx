import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const SNAP_DISTANCE = 80;

export default function DragDropActivity({ activityConfig, onComplete }) {
  const [labels, setLabels] = useState([]);
  const [droppedLabels, setDroppedLabels] = useState({});
  const [startTime] = useState(Date.now());
  const [showAnswerKey, setShowAnswerKey] = useState(false);

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



  const handleDragEnd = (tempId, label) => {
    setDroppedLabels(prev => ({ ...prev, [label.id]: true }));
  };

  const isComplete = Object.keys(droppedLabels).length === activityConfig.labels.length;

  useEffect(() => {
    if (isComplete) {
      const duration = (Date.now() - startTime) / 1000;
      setTimeout(() => {
        onComplete({
          activityType: activityConfig.id,
          totalLabels: activityConfig.labels.length,
          durationSeconds: Math.round(duration),
        });
      }, 600);
    }
  }, [isComplete, startTime, activityConfig, droppedLabels, onComplete]);

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
      <div className="flex-1 flex flex-col gap-4 p-3 sm:p-6 bg-[var(--modal-bg)] overflow-auto relative">
        {/* Answer Key Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#400070] text-[#400070] rounded-lg font-semibold text-sm hover:bg-[var(--modal-bg)] transition-all shadow-md"
          >
            {showAnswerKey ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Answer
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                See Answer
              </>
            )}
          </button>
        </div>

        {/* Image with Drop Zones */}
        <div className="relative flex-1 bg-white rounded-xl overflow-hidden flex items-center justify-center">
          {showAnswerKey ? (
            <img
              src={activityConfig.answerKeyUrl}
              alt="Answer Key"
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          ) : (
            <img
              src={activityConfig.imageUrl}
              alt={activityConfig.title}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          )}
          
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
              className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"
            >
              <div className="bg-white rounded-2xl p-6 text-center shadow-2xl">
                <p className="text-2xl font-bold text-blue-600">All labels placed!</p>
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
                  handleDragEnd(label.tempId, label);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: droppedLabels[label.id] ? 0.5 : 1 }}
                className={`
                  min-h-[40px] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm
                  border-2 cursor-grab active:cursor-grabbing select-none
                  transition-all touch-none
                  ${droppedLabels[label.id] 
                    ? "opacity-50 border-gray-400 bg-gray-100 text-gray-600" 
                    : "border-[#400070] bg-white text-[#400070] hover:shadow-md"
                  }
                `}
              >
                {label.name}
              </motion.button>
            </div>
          ))}
        </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-3 border-2 border-[var(--modal-border)]">
          <p className="text-xs font-semibold text-[var(--modal-text)] mb-2">
            Progress: {Object.keys(droppedLabels).length} / {activityConfig.labels.length}
          </p>
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