import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { speak, stop, isSpeaking } from "./tts";

export default function ReadAloudButton({ text, rate = 1.0, size = "sm" }) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Check if speech is still playing
    const interval = setInterval(() => {
      if (isPlaying && !isSpeaking()) {
        setIsPlaying(false);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleToggle = async () => {
    if (isPlaying) {
      stop();
      setIsPlaying(false);
    } else {
      await speak(text, rate);
      setIsPlaying(true);
    }
  };

  return (
    <Button
      size={size}
      variant="ghost"
      onClick={handleToggle}
      className={`gap-1 transition-all ${
        isPlaying ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
      }`}
      title={isPlaying ? "Stop reading" : "Read aloud"}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Read</span>
        </>
      )}
    </Button>
  );
}