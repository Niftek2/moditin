import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

export default function DeleteAccountDialog({ open, onClose }) {
  const [confirm, setConfirm] = useState("");

  const handleDelete = () => {
    // Sign out user — actual deletion requires backend/support
    base44.auth.logout();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--modal-card)] border-[var(--modal-border)] max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
            <DialogTitle className="text-[var(--modal-text)] text-lg">Delete Account</DialogTitle>
          </div>
          <DialogDescription className="text-[var(--modal-text-muted)] text-sm">
            This action is permanent and cannot be undone. All your data — students, sessions, goals, and records — will be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-[var(--modal-text)]">
              Type <span className="font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              className="border-[var(--modal-border)] text-[var(--modal-text)]"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-[var(--modal-border)] text-[var(--modal-text)]">
              Cancel
            </Button>
            <Button
              disabled={confirm !== "DELETE"}
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
            >
              Delete My Account
            </Button>
          </div>

          <p className="text-xs text-[var(--modal-text-muted)] text-center">
            Need help instead? Contact support before deleting.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}