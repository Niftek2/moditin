import React, { useState, useRef, useCallback } from "react";
import { Ear, Play, Square, AlertCircle, Info, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// ─── Hearing loss presets ───────────────────────────────────────────────────
// Each preset defines gain (dB) adjustments per frequency band.
// Values are negative (attenuation). 0 = no loss. -60 = near-total loss.
// Bands: 250Hz, 500Hz, 1kHz, 2kHz, 3kHz, 4kHz, 6kHz, 8kHz

const PRESETS = [
  {
    id: "normal",
    label: "Normal Hearing",
    description: "No filtering applied. Baseline reference.",
    color: "#400070",
    gains: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "mild_hf",
    label: "Mild High-Frequency",
    description: "Common in early noise-induced or age-related loss. Affects /s/, /f/, /th/.",
    color: "#6B2FB9",
    gains: [0, 0, 0, -10, -15, -20, -25, -30],
  },
  {
    id: "moderate_hf",
    label: "Moderate High-Frequency",
    description: "Significant difficulty hearing consonants. Speech sounds muffled.",
    color: "#9333EA",
    gains: [0, 0, -5, -25, -35, -40, -45, -50],
  },
  {
    id: "flat_moderate",
    label: "Flat Moderate Loss",
    description: "Uniform loss across all frequencies. Everything is quieter.",
    color: "#7C3AED",
    gains: [-25, -25, -25, -25, -25, -25, -25, -25],
  },
  {
    id: "cookie_bite",
    label: "Cookie-Bite (Mid-Frequency)",
    description: "Loss in the 500Hz–2kHz range. Affects vowels and voiced consonants.",
    color: "#5B21B6",
    gains: [0, -20, -35, -40, -30, -15, 0, 0],
  },
  {
    id: "severe",
    label: "Severe Loss",
    description: "Very limited hearing. Loud speech barely audible without amplification.",
    color: "#3B0764",
    gains: [-40, -45, -50, -55, -55, -60, -60, -60],
  },
];

const BAND_FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const BAND_LABELS = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"];

// ─── Web Audio filter chain ─────────────────────────────────────────────────
function buildFilterChain(audioCtx, gainValues) {
  const filters = BAND_FREQUENCIES.map((freq, i) => {
    const filter = audioCtx.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = freq;
    filter.Q.value = 1.4;
    filter.gain.value = gainValues[i];
    return filter;
  });

  for (let i = 0; i < filters.length - 1; i++) {
    filters[i].connect(filters[i + 1]);
  }

  return filters;
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function HearingLossSimulator() {
  const [status, setStatus] = useState("idle"); // idle | running | error | permission_denied
  const [errorMessage, setErrorMessage] = useState("");
  const [activePresetId, setActivePresetId] = useState("mild_hf");
  const [customGains, setCustomGains] = useState(
    PRESETS.find((p) => p.id === "mild_hf").gains.slice()
  );
  const [isCustomMode, setIsCustomMode] = useState(false);

  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const filtersRef = useRef([]);
  const streamRef = useRef(null);

  const activePreset = PRESETS.find((p) => p.id === activePresetId);
  const displayGains = isCustomMode ? customGains : activePreset.gains;

  // ── Start session ──────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setErrorMessage("");
    setStatus("idle");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage(
        "Your browser does not support microphone access. Please use Chrome, Firefox, Edge, or Safari 14.1+."
      );
      setStatus("error");
      return;
    }

    if (typeof AudioContext === "undefined" && typeof webkitAudioContext === "undefined") {
      setErrorMessage(
        "Your browser does not support the Web Audio API required for this simulator."
      );
      setStatus("error");
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("permission_denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No microphone found. Please connect a microphone and try again.");
        setStatus("error");
      } else {
        setErrorMessage(`Microphone error: ${err.message}`);
        setStatus("error");
      }
      return;
    }

    streamRef.current = stream;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const gains = isCustomMode ? customGains : activePreset.gains;
    const filters = buildFilterChain(ctx, gains);
    filtersRef.current = filters;

    source.connect(filters[0]);
    filters[filters.length - 1].connect(ctx.destination);

    setStatus("running");
  }, [activePreset, isCustomMode, customGains]);

  // ── Stop session ───────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    try {
      if (sourceRef.current) sourceRef.current.disconnect();
      filtersRef.current.forEach((f) => { try { f.disconnect(); } catch {} });
    } catch {}

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    filtersRef.current = [];
    sourceRef.current = null;
    setStatus("idle");
  }, []);

  // ── Live update filter gains while running ─────────────────────────────────
  const applyGainsLive = useCallback((gains) => {
    if (status !== "running" || filtersRef.current.length === 0) return;
    gains.forEach((gainValue, i) => {
      if (filtersRef.current[i]) {
        filtersRef.current[i].gain.setTargetAtTime(
          gainValue,
          audioCtxRef.current.currentTime,
          0.05
        );
      }
    });
  }, [status]);

  // ── Preset selection ───────────────────────────────────────────────────────
  const handlePresetSelect = useCallback((preset) => {
    setActivePresetId(preset.id);
    setIsCustomMode(false);
    setCustomGains(preset.gains.slice());
    applyGainsLive(preset.gains);
  }, [applyGainsLive]);

  // ── Manual slider change ───────────────────────────────────────────────────
  const handleSliderChange = useCallback((bandIndex, value) => {
    const newGains = customGains.slice();
    newGains[bandIndex] = value;
    setCustomGains(newGains);
    setIsCustomMode(true);
    applyGainsLive(newGains);
  }, [customGains, applyGainsLive]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  React.useEffect(() => {
    return () => {
      handleStop();
    };
  }, [handleStop]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EADDF5] flex items-center justify-center shrink-0">
          <Ear className="w-6 h-6 text-[#400070]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1028]">Hearing Loss Simulator</h1>
          <p className="text-[#4A4A4A] mt-0.5">
            Demonstrate what different types of hearing loss sound like using your device microphone.
            Intended for professional awareness and parent/educator education.
          </p>
        </div>
      </div>

      {/* How to use callout */}
      <div className="flex gap-3 bg-[#F3EBF9] border border-[#C4A8E0] rounded-xl p-4">
        <Info className="w-5 h-5 text-[#6B2FB9] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-[#1A1028]">
          <span className="font-semibold">How to use: </span>
          Wear headphones for best results. Select a hearing loss type, press <strong>Start</strong>,
          and speak normally — you will hear your voice filtered in real time. Press <strong>Stop</strong>
          to end the session. Microphone access is required and is not recorded.
        </div>
      </div>

      {/* Permission denied state */}
      {status === "permission_denied" && (
        <div
          role="alert"
          className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">Microphone access was denied.</p>
            <p>
              To use the simulator, allow microphone access in your browser settings, then reload
              the page. In Chrome: click the lock icon in the address bar → Microphone → Allow.
            </p>
          </div>
        </div>
      )}

      {/* Generic error state */}
      {status === "error" && errorMessage && (
        <div
          role="alert"
          className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Preset selector */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1A1028]">Select Hearing Loss Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id && !isCustomMode;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`text-left rounded-xl border px-4 py-3 transition-all ${
                  isActive
                    ? "bg-[#EADDF5] border-[#6B2FB9] text-[#400070]"
                    : "bg-white border-[var(--modal-border)] text-[#1A1028] hover:bg-[#F7F3FA] hover:border-[#C4A8E0]"
                }`}
                aria-pressed={isActive}
              >
                <p className={`text-sm font-semibold ${isActive ? "text-[#400070]" : "text-[#1A1028]"}`}>
                  {preset.label}
                </p>
                <p className="text-xs text-[#4A4A4A] mt-0.5 leading-snug">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual frequency sliders */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1A1028]">Manual Adjustment</h2>
          {isCustomMode && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EADDF5] text-[#6B2FB9]">
              Custom
            </span>
          )}
        </div>
        <p className="text-xs text-[#4A4A4A]">
          Adjust individual frequency bands. Changes apply instantly if the simulator is running.
          0 dB = no change. −60 dB = near-total attenuation.
        </p>
        <div className="space-y-4">
          {BAND_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-xs font-semibold text-[#4A4A4A] w-8 text-right shrink-0">
                {label}
              </span>
              <div className="flex-1">
                <Slider
                  min={-60}
                  max={0}
                  step={1}
                  value={[displayGains[i]]}
                  onValueChange={([val]) => handleSliderChange(i, val)}
                  aria-label={`${label}Hz gain`}
                  className="w-full"
                />
              </div>
              <span className="text-xs font-mono text-[#4A4A4A] w-10 shrink-0">
                {displayGains[i]} dB
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Start / Stop controls */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {status === "running" ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                <span className="text-sm font-semibold text-green-700">Simulator running — speak normally</span>
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5 text-[#4A4A4A]" aria-hidden="true" />
                <span className="text-sm text-[#4A4A4A]">Simulator is off</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            {status !== "running" ? (
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 bg-[#400070] hover:bg-[#6B2FB9] text-white font-semibold rounded-xl px-5 py-2.5 transition-colors text-sm"
                aria-label="Start hearing loss simulator"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                Start Simulator
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors text-sm"
                aria-label="Stop hearing loss simulator"
              >
                <Square className="w-4 h-4" aria-hidden="true" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Headphone reminder */}
        <div className="mt-4 flex items-center gap-2 text-xs text-[#4A4A4A]">
          <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>For best results, wear headphones to prevent microphone feedback.</span>
        </div>
      </div>

      {/* Clinical disclaimer */}
      <p className="text-xs text-[#4A4A4A] text-center pb-4">
        This simulator is an educational awareness tool for itinerant professionals and caregivers.
        It does not replicate the full experience of hearing loss and should not be used for clinical
        assessment or diagnosis.
      </p>

    </div>
  );
}