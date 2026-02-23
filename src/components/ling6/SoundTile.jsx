import React, { useState } from "react";
import { Play, Square, CheckCircle2 } from "lucide-react";
import { SOUND_LABELS, soundStatusColor, soundStatusDotColor, playLing6Sound } from "./ling6Utils";

export default function SoundTile({ sound, status, isSelected, onClick, deliveryMethod }) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (playing) return;
    setPlaying(true);
    playLing6Sound(sound, () => setPlaying(false));
  };

  const isComplete = status === "Identified" || status === "Detected" || status === "NoResponse" || status === "Incorrect";
  const colorClass = soundStatusColor(status);
  const dotColor = soundStatusDotColor(status);

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 min-h-[100px] w-full
        ${isSelected ? "border-[#6B2FB9] shadow-lg scale-[1.02]" : "border-transparent hover:border-[#6B2FB9]/40"}
        ${colorClass}
      `}
    >
      {/* Status dot */}
      <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${dotColor}`} />

      {/* Complete checkmark */}
      {isComplete && (
        <div className="absolute top-2 left-2">
          <CheckCircle2 className={`w-4 h-4 ${status === "Identified" ? "text-green-600" : status === "Detected" ? "text-yellow-600" : "text-gray-400"}`} />
        </div>
      )}

      <span className="text-2xl font-bold tracking-wide mb-1">{SOUND_LABELS[sound]}</span>
      <span className="text-xs font-medium opacity-70">
        {status === "NotTested" ? "Not started" : status}
      </span>

      {/* Play button for SoundClip mode */}
      {deliveryMethod === "SoundClip" && (
        <button
          onClick={handlePlay}
          className={`mt-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all
            ${playing ? "bg-[#400070] text-white" : "bg-white/70 text-[#400070] hover:bg-[#EADDF5]"}
          `}
        >
          {playing ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {playing ? "Playing…" : "Play"}
        </button>
      )}
    </button>
  );
}