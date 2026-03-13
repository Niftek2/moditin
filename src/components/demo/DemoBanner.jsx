import React from "react";
import { useDemo } from "./DemoContext";
import { Button } from "@/components/ui/button";
import { FlaskConical, RotateCcw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function DemoBanner() {
  const { isDemoMode, resetDemo } = useDemo();
  if (!isDemoMode) return null;

  return (
    <div
      className="fixed top-1 left-0 right-0 z-[49] flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-400 text-amber-900 shadow-md"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-semibold min-w-0">
        <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline truncate">Demo Mode — sample data only.</span>
        <span className="inline sm:hidden text-xs">Demo Mode</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs px-2 text-amber-900 hover:bg-amber-500 hover:text-amber-950 font-semibold"
          onClick={resetDemo}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
        <Link to={createPageUrl("Join")}>
          <Button
            size="sm"
            className="h-7 text-xs px-3 bg-[#400070] hover:bg-[#5B00A0] text-white font-semibold gap-1 shadow-sm"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Want to try it yourself? Free for 7 days</span>
            <span className="inline sm:hidden">Start free trial</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}