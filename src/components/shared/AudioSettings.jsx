import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { speak } from "./tts";

export default function AudioSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser?.id) {
          const userSettings = await base44.entities.UserAudioSettings.filter({
            userId: currentUser.id,
          });
          
          if (userSettings?.length > 0) {
            setSettings(userSettings[0]);
          } else {
            // Create default settings
            const defaultSettings = {
              userId: currentUser.id,
              enabled: true,
              rate: 1.0,
              speakChoices: false,
              autoSpeakPrompt: false,
            };
            const created = await base44.entities.UserAudioSettings.create(defaultSettings);
            setSettings(created);
          }
        }
      } catch (error) {
        console.error("Error loading audio settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleUpdate = async (updates) => {
    if (!settings?.id) return;
    setSaving(true);
    try {
      await base44.entities.UserAudioSettings.update(settings.id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      setSettings(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error("Error updating audio settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (previewPlaying) return;
    setPreviewPlaying(true);
    const sampleText = "This is a preview of the read-aloud feature. Teachers can use this to read prompts and activities aloud during sessions.";
    await speak(sampleText, settings?.rate || 1.0);
    setTimeout(() => setPreviewPlaying(false), 5000);
  };

  if (loading) {
    return <div className="text-center py-4 text-sm text-[var(--modal-text-muted)]">Loading audio settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-4 text-sm text-red-600">Could not load settings</div>;
  }

  return (
    <div className="space-y-4">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-[var(--modal-text)]">Read Aloud Feature</Label>
          <p className="text-xs text-[var(--modal-text-muted)] mt-1">Enable text-to-speech for activities and worksheets</p>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => handleUpdate({ enabled: checked })}
          disabled={saving}
        />
      </div>

      {settings.enabled && (
        <>
          {/* Speech Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate" className="text-[var(--modal-text)]">Speech Rate</Label>
              <span className="text-sm font-semibold text-[#400070] tabular-nums">
                {(settings.rate || 1.0).toFixed(2)}×
              </span>
            </div>
            <Slider
              id="rate"
              min={0.5}
              max={2.0}
              step={0.05}
              value={[settings.rate || 1.0]}
              onValueChange={(vals) => setSettings(prev => ({ ...prev, rate: vals[0] }))}
              onValueCommit={(vals) => handleUpdate({ rate: vals[0] })}
              disabled={saving}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[var(--modal-text-muted)]">
              <span>0.5× Slower</span>
              <span>1.0× Normal</span>
              <span>2.0× Faster</span>
            </div>
            <p className="text-xs text-[var(--modal-text-muted)]">Using your custom Nadia voice (Speechify).</p>
          </div>

          {/* Speak Answer Choices */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[var(--modal-text)]">Speak Answer Choices</Label>
              <p className="text-xs text-[var(--modal-text-muted)] mt-1">Read aloud answer options in activities</p>
            </div>
            <Switch
              checked={settings.speakChoices}
              onCheckedChange={(checked) => handleUpdate({ speakChoices: checked })}
              disabled={saving}
            />
          </div>

          {/* Auto-Speak Prompt */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[var(--modal-text)]">Auto-Speak Prompts</Label>
              <p className="text-xs text-[var(--modal-text-muted)] mt-1">Automatically read prompt on each new item</p>
            </div>
            <Switch
              checked={settings.autoSpeakPrompt}
              onCheckedChange={(checked) => handleUpdate({ autoSpeakPrompt: checked })}
              disabled={saving}
            />
          </div>

          {/* Preview Button */}
          <Button
            onClick={handlePreview}
            disabled={saving || previewPlaying}
            variant="outline"
            className="border-[var(--modal-border)] text-[var(--modal-text)] gap-2 w-full"
          >
            <Volume2 className="w-4 h-4" />
            {previewPlaying ? "Playing preview..." : "Preview Audio"}
          </Button>

          {/* Privacy Footer */}
          <div className="pt-2 border-t border-[var(--modal-border)]">
            <p className="text-xs text-[var(--modal-text-muted)] italic">
              ℹ️ Audio playback is instructional support only. Not diagnostic. No audio is stored or sent to external services.
            </p>
          </div>
        </>
      )}
    </div>
  );
}