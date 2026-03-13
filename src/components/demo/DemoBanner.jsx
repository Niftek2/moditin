import React from "react";
import { useDemo } from "./DemoContext";
import { Button } from "@/components/ui/button";
import { FlaskConical, RotateCcw, X } from "lucide-react";

export default function DemoBanner() {
  const { isDemoMode, exitDemo, resetDemo } = useDemo();
  if (!isDemoMode) return null;

  return (
    <div
      className="fixed top-1 left-0 right-0 z-[49] flex items-center justify-between gap-2 px-4 py-2 bg-amber-400 text-amber-900 shadow-md"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-semibold min-w-0">
        <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Demo Mode — sample data only. Changes will not be saved.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs px-2 text-amber-900 hover:bg-amber-500 hover:text-amber-950 font-semibold"
          onClick={resetDemo}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs px-2 text-amber-900 hover:bg-amber-500 hover:text-amber-950 font-semibold"
          onClick={exitDemo}
        >
          <X className="w-3 h-3 mr-1" />
          Exit Demo
        </Button>
      </div>
    </div>
  );
}