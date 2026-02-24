import React from "react";
import { Volume2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherPrompt({ prompt, templateType }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-5 h-5 text-amber-700" />
        <h3 className="font-semibold text-amber-900">Teacher Prompt</h3>
      </div>
      <p className="text-sm text-amber-900 leading-relaxed mb-4 whitespace-pre-wrap">{prompt}</p>
      <Button
        onClick={handleCopy}
        variant="outline"
        size="sm"
        className="border-amber-200 text-amber-700 hover:bg-amber-100"
      >
        <Copy className="w-4 h-4" /> Copy
      </Button>
    </div>
  );
}