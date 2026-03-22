import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, Loader2, ArrowRight } from "lucide-react";

/**
 * Wraps demo entry — collects an email, sends a notification to contact@modalmath.com,
 * then calls onEnter() to proceed into demo mode.
 */
export default function DemoEmailGate({ onEnter, onCancel }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Save to database
      await base44.entities.DemoSignup.create({ email: email.trim() });
    } catch (_) {}
    try {
      await base44.integrations.Core.SendEmail({
        to: "nadiajiftekhar@gmail.com",
        subject: "New Demo Sign-Up — Modal Itinerant",
        body: `Someone signed up to view the demo of Modal Itinerant.\n\nEmail: ${email.trim()}\nDate: ${new Date().toLocaleString()}`,
      });
    } catch (_) {
      // Don't block the user if email fails — just proceed
    }
    setLoading(false);
    onEnter();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[var(--modal-border)] w-full max-w-sm p-7">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-6 h-6 text-[#400070]" />
          <h2 className="text-lg font-bold text-[var(--modal-text)]">Explore with Sample Data</h2>
        </div>
        <p className="text-sm text-[var(--modal-text-muted)] mb-5">
          Enter your email to preview Modal Itinerant with sample data. No password required — no account created.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-[var(--modal-border)] text-[var(--modal-text)]"
            required
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Just a moment…</>
            ) : (
              <>Explore Demo <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-xs text-[var(--modal-text-muted)] hover:text-[#400070] transition-colors mt-1"
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  );
}