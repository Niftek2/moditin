import React from "react";
import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="modal-card flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#400070]/20 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[var(--modal-purple-glow)]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-[var(--modal-text-muted)] max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}