import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u?.full_name) {
        // User already has a full name, skip onboarding
        navigate("/");
      } else {
        setUser(u);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    try {
      await base44.auth.updateMe({ full_name: fullName });
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--modal-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#400070] to-[#6B2FB9] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--modal-text)]">Welcome!</h1>
          <p className="text-sm text-[var(--modal-text-muted)] mt-2">Let's get to know you better</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[var(--modal-text)] font-semibold">
              What's your first name? *
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="e.g., Jane"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="bg-white border-[var(--modal-border)] text-[var(--modal-text)] h-12 rounded-xl"
              autoFocus
            />
            <p className="text-xs text-[var(--modal-text-muted)]">We'll use this to personalize your experience</p>
          </div>

          <Button
            type="submit"
            disabled={loading || !fullName.trim()}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white h-12 rounded-xl font-semibold gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}