import React from "react";
import { AlertTriangle } from "lucide-react";

export default function AIDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <p className="text-[10px] text-[var(--modal-text-muted)] italic">
        AI can make mistakes. This does not constitute medical, diagnostic, or legal advice.
      </p>
    );
  }
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
      <div className="text-xs text-amber-300/80">
        <p className="font-medium">AI-Generated Content</p>
        <p className="mt-0.5 opacity-80">AI can make mistakes. This tool does not diagnose, provide medical advice, or give legal advice. Follow district/state procedures and consult licensed professionals as required.</p>
      </div>
    </div>
  );
}