import React, { useState, useRef, useCallback, useEffect } from "react";
import { Ear, Mic, Square, Play, AlertCircle, Info, Volume2, RefreshCw, ArrowLeftRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import StudentAudiogramLoader from "../components/simulator/StudentAudiogramLoader";

// ─── Hearing loss presets ────────────────────────────────────────────────────
const PRESETS = [
  {
    id: "normal",
    label: "Normal Hearing",
    description: "No filtering applied. Baseline reference.",
    gains: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "mild_hf",
    label: "Mild High-Frequency",
    description: "Common in early noise-induced or age-related loss. Affects /s/, /f/, /th/.",
    gains: [0, 0, 0, -10, -15, -20, -25, -30],
  },
  {
    id: "moderate_hf",
    label: "Moderate High-Frequency",
    description: "Significant difficulty hearing consonants. Speech sounds muffled.",
    gains: [0, 0, -5, -25, -35, -40, -45, -50],
  },
  {
    id: "flat_moderate",
    label: "Flat Moderate Loss",
    description: "Uniform loss across all frequencies. Everything is quieter.",
    gains: [-25, -25, -25, -25, -25, -25, -25, -25],
  },
  {
    id: "cookie_bite",
    label: "Cookie-Bite (Mid-Frequency)",
    description: "Loss in the 500Hz–2kHz range. Affects vowels and voiced consonants.",
    gains: [0, -20, -35, -40, -30, -15, 0, 0],
  },
  {
    id: "severe",
    label: "Severe Loss",
    description: "Very limited hearing. Loud speech barely audible without amplification.",
    gains: [-40, -45, -50, -55, -55, -60, -60, -60],
  },
];

const BAND_FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const BAND_LABELS = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"];

// Apply filter chain to an AudioBuffer, returns a new AudioBuffer
async function applyFiltersToBuffer(audioCtx, inputBuffer, gainValues) {
  const offlineCtx = new OfflineAudioContext(
    inputBuffer.numberOfChannels,
    inputBuffer.length,
    inputBuffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = inputBuffer;

  // Build filter chain
  const filters = BAND_FREQUENCIES.map((freq, i) => {
    const f = offlineCtx.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = freq;
    f.Q.value = 1.4;
    f.gain.value = gainValues[i];
    return f;
  });

  for (let i = 0; i < filters.length - 1; i++) {
    filters[i].connect(filters[i + 1]);
  }

  source.connect(filters[0]);
  filters[filters.length - 1].connect(offlineCtx.destination);
  source.start(0);

  return offlineCtx.startRendering();
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function HearingLossSimulator() {
  // status: idle | recording | processing | ready | playing_normal | playing_simulated | error | permission_denied
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePresetId, setActivePresetId] = useState("mild_hf");
  const [customGains, setCustomGains] = useState(PRESETS.find(p => p.id === "mild_hf").gains.slice());
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [playingMode, setPlayingMode] = useState(null); // 'normal' | 'simulated'
  const [studentSimLabel, setStudentSimLabel] = useState(null);
  const [studentSimInterpretation, setStudentSimInterpretation] = useState(null);

  const audioCtxRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const rawBufferRef = useRef(null);       // original recorded AudioBuffer
  const filteredBufferRef = useRef(null);  // filter-processed AudioBuffer
  const playbackSourceRef = useRef(null);

  const activePreset = PRESETS.find(p => p.id === activePresetId);
  const displayGains = isCustomMode ? customGains : activePreset.gains;

  const isReady = ["ready", "playing_normal", "playing_simulated"].includes(status);

  // ── Get or create AudioContext ─────────────────────────────────────────────
  const getAudioCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const Cls = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Cls();
    }
    return audioCtxRef.current;
  };

  // ── Start recording ────────────────────────────────────────────────────────
  const handleRecord = useCallback(async () => {
    setErrorMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Your browser does not support microphone access. Please use Chrome, Firefox, Edge, or Safari 14.1+.");
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

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Stop all mic tracks
      stream.getTracks().forEach(t => t.stop());

      setStatus("processing");
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const arrayBuffer = await blob.arrayBuffer();

      const ctx = getAudioCtx();
      let decoded;
      try {
        decoded = await ctx.decodeAudioData(arrayBuffer);
      } catch {
        setErrorMessage("Could not decode the recorded audio. Please try again.");
        setStatus("error");
        return;
      }

      rawBufferRef.current = decoded;

      // Pre-render filtered version
      const gains = isCustomMode ? customGains : activePreset.gains;
      const filtered = await applyFiltersToBuffer(ctx, decoded, gains);
      filteredBufferRef.current = filtered;

      setStatus("ready");
    };

    recorder.start();
    setStatus("recording");
  }, [activePreset, isCustomMode, customGains]);

  // ── Stop recording ─────────────────────────────────────────────────────────
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Stop any active playback ───────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    if (playbackSourceRef.current) {
      try { playbackSourceRef.current.stop(); } catch {}
      playbackSourceRef.current = null;
    }
    setPlayingMode(null);
    setStatus("ready");
  }, []);

  // ── Play a buffer ──────────────────────────────────────────────────────────
  const playBuffer = useCallback((buffer, mode) => {
    if (playbackSourceRef.current) {
      try { playbackSourceRef.current.stop(); } catch {}
      playbackSourceRef.current = null;
    }

    const ctx = getAudioCtx();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      playbackSourceRef.current = null;
      setPlayingMode(null);
      setStatus("ready");
    };
    src.start(0);
    playbackSourceRef.current = src;
    setPlayingMode(mode);
    setStatus(mode === "normal" ? "playing_normal" : "playing_simulated");
  }, []);

  const handlePlayNormal = useCallback(() => {
    if (!rawBufferRef.current) return;
    if (playingMode === "normal") { stopPlayback(); return; }
    playBuffer(rawBufferRef.current, "normal");
  }, [playBuffer, stopPlayback, playingMode]);

  const handlePlaySimulated = useCallback(() => {
    if (!filteredBufferRef.current) return;
    if (playingMode === "simulated") { stopPlayback(); return; }
    playBuffer(filteredBufferRef.current, "simulated");
  }, [playBuffer, stopPlayback, playingMode]);

  // ── Re-record ──────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    stopPlayback();
    rawBufferRef.current = null;
    filteredBufferRef.current = null;
    setStatus("idle");
    setPlayingMode(null);
  }, [stopPlayback]);

  // ── Student profile load ───────────────────────────────────────────────────
  const handleStudentGainsLoaded = useCallback(async (gains, label, source, interpretation) => {
    if (!gains) {
      setStudentSimLabel(null);
      setStudentSimInterpretation(null);
      return;
    }
    setCustomGains(gains);
    setIsCustomMode(true);
    setActivePresetId(null);
    setStudentSimLabel(label);
    setStudentSimInterpretation(interpretation || null);

    if (rawBufferRef.current) {
      setStatus("processing");
      stopPlayback();
      const ctx = getAudioCtx();
      const filtered = await applyFiltersToBuffer(ctx, rawBufferRef.current, gains);
      filteredBufferRef.current = filtered;
      setStatus("ready");
    }
  }, [stopPlayback]);

  // ── Preset selection ───────────────────────────────────────────────────────
  const handlePresetSelect = useCallback(async (preset) => {
    setActivePresetId(preset.id);
    setIsCustomMode(false);
    setCustomGains(preset.gains.slice());
    setStudentSimLabel(null);
    setStudentSimInterpretation(null);

    // Re-render filtered buffer if we already have a recording
    if (rawBufferRef.current) {
      setStatus("processing");
      stopPlayback();
      const ctx = getAudioCtx();
      const filtered = await applyFiltersToBuffer(ctx, rawBufferRef.current, preset.gains);
      filteredBufferRef.current = filtered;
      setStatus("ready");
    }
  }, [stopPlayback]);

  // ── Slider change ──────────────────────────────────────────────────────────
  const handleSliderChange = useCallback(async (bandIndex, value) => {
    const newGains = customGains.slice();
    newGains[bandIndex] = value;
    setCustomGains(newGains);
    setIsCustomMode(true);

    if (rawBufferRef.current) {
      stopPlayback();
      const ctx = getAudioCtx();
      const filtered = await applyFiltersToBuffer(ctx, rawBufferRef.current, newGains);
      filteredBufferRef.current = filtered;
      if (status === "ready" || status === "playing_normal" || status === "playing_simulated") {
        setStatus("ready");
      }
    }
  }, [customGains, stopPlayback, status]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (playbackSourceRef.current) { try { playbackSourceRef.current.stop(); } catch {} }
      if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EADDF5] flex items-center justify-center shrink-0">
          <Ear className="w-6 h-6 text-[#400070]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1028]">Hearing Loss Simulator</h1>
          <p className="text-[#4A4A4A] mt-0.5">
            Record a short clip, then compare how it sounds with and without simulated hearing loss.
            Intended for professional awareness and parent/educator education.
          </p>
        </div>
      </div>

      {/* How to use */}
      <div className="flex gap-3 bg-[#F3EBF9] border border-[#C4A8E0] rounded-xl p-4">
        <Info className="w-5 h-5 text-[#6B2FB9] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-[#1A1028]">
          <span className="font-semibold">How to use: </span>
          Select a hearing loss type, press <strong>Record</strong> and speak for a few seconds, then press <strong>Stop Recording</strong>.
          Use the <strong>Play Normal</strong> and <strong>Play Simulated</strong> buttons to compare. Wear headphones for best results.
        </div>
      </div>

      {/* Errors */}
      {status === "permission_denied" && (
        <div role="alert" className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">Microphone access was denied.</p>
            <p>Allow microphone access in your browser settings, then reload the page. In Chrome: click the lock icon → Microphone → Allow.</p>
          </div>
        </div>
      )}
      {status === "error" && errorMessage && (
        <div role="alert" className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Student hearing profile loader */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <StudentAudiogramLoader onGainsLoaded={handleStudentGainsLoaded} />
        {studentSimInterpretation && (
          <div className="text-xs text-[#4A4A4A] bg-[#F7F3FA] rounded-xl p-3 border border-[#D8CDE5]">
            <span className="font-semibold text-[#400070]">AI interpretation: </span>
            {studentSimInterpretation}
          </div>
        )}
      </div>

      {/* Preset selector */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1A1028]">
          {studentSimLabel ? "Or Override with a Preset" : "Select Hearing Loss Type"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id && !isCustomMode;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`text-left rounded-xl border px-4 py-3 transition-all ${
                  isActive
                    ? "bg-[#EADDF5] border-[#6B2FB9]"
                    : "bg-white border-[var(--modal-border)] hover:bg-[#F7F3FA] hover:border-[#C4A8E0]"
                }`}
                aria-pressed={isActive}
              >
                <p className={`text-sm font-semibold ${isActive ? "text-[#400070]" : "text-[#1A1028]"}`}>{preset.label}</p>
                <p className="text-xs text-[#4A4A4A] mt-0.5 leading-snug">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual sliders */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1A1028]">Manual Adjustment</h2>
          {isCustomMode && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EADDF5] text-[#6B2FB9]">Custom</span>
          )}
        </div>
        <p className="text-xs text-[#4A4A4A]">
          Adjust individual frequency bands. 0 dB = no change. −60 dB = near-total attenuation. Changes re-process the recording automatically.
        </p>
        <div className="space-y-4">
          {BAND_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-xs font-semibold text-[#4A4A4A] w-8 text-right shrink-0">{label}</span>
              <div className="flex-1">
                <Slider
                  min={-60} max={0} step={1}
                  value={[displayGains[i]]}
                  onValueChange={([val]) => handleSliderChange(i, val)}
                  aria-label={`${label}Hz gain`}
                  className="w-full"
                />
              </div>
              <span className="text-xs font-mono text-[#4A4A4A] w-10 shrink-0">{displayGains[i]} dB</span>
            </div>
          ))}
        </div>
      </div>

      {/* Record + Compare controls */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-5">

        {/* Step 1 — Record */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6B2FB9] mb-3">Step 1 — Record</p>
          <div className="flex items-center gap-3 flex-wrap">
            {status === "recording" ? (
              <>
                <span className="flex items-center gap-2 text-sm font-semibold text-red-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  Recording… speak now
                </span>
                <button
                  onClick={handleStopRecording}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors text-sm"
                >
                  <Square className="w-4 h-4" />
                  Stop Recording
                </button>
              </>
            ) : status === "processing" ? (
              <span className="text-sm text-[#4A4A4A]">Processing audio…</span>
            ) : isReady ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-green-700 font-semibold">✓ Recording ready</span>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 border border-[var(--modal-border)] text-[#400070] font-semibold rounded-xl px-4 py-2 hover:bg-[#F7F3FA] transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-record
                </button>
              </div>
            ) : (
              <button
                onClick={handleRecord}
                className="inline-flex items-center gap-2 bg-[#400070] hover:bg-[#6B2FB9] text-white font-semibold rounded-xl px-5 py-2.5 transition-colors text-sm"
              >
                <Mic className="w-4 h-4" />
                Record
              </button>
            )}
          </div>
        </div>

        {/* Step 2 — Compare */}
        {isReady && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B2FB9] mb-3">Step 2 — Compare</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Normal */}
              <button
                onClick={handlePlayNormal}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-5 transition-all font-semibold text-sm ${
                  playingMode === "normal"
                    ? "bg-slate-800 border-slate-800 text-white"
                    : "bg-white border-[var(--modal-border)] text-[#1A1028] hover:bg-[#F7F3FA] hover:border-[#C4A8E0]"
                }`}
              >
                {playingMode === "normal" ? (
                  <Square className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 text-slate-600" />
                )}
                <span>Normal Hearing</span>
                <span className="text-xs font-normal opacity-60">Unfiltered</span>
              </button>

              {/* Simulated */}
              <button
                onClick={handlePlaySimulated}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-5 transition-all font-semibold text-sm ${
                  playingMode === "simulated"
                    ? "bg-[#400070] border-[#400070] text-white"
                    : "bg-white border-[#6B2FB9] text-[#400070] hover:bg-[#EADDF5]"
                }`}
              >
                {playingMode === "simulated" ? (
                  <Square className="w-5 h-5" />
                ) : (
                  <Ear className="w-5 h-5" />
                )}
                <span className="text-center leading-tight">
                  {studentSimLabel ? "Student Profile" : isCustomMode ? "Custom" : activePreset?.label}
                </span>
                <span className="text-xs font-normal opacity-70">
                  {studentSimLabel ? "AI-estimated" : "Simulated loss"}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#4A4A4A]">
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
              <span>Tap each button to switch between perspectives. Click again to stop.</span>
            </div>
          </div>
        )}

        {/* Headphone tip */}
        <div className="flex items-center gap-2 text-xs text-[#4A4A4A] pt-1 border-t border-[var(--modal-border)]">
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>Wear headphones for best results and to prevent microphone feedback.</span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[#4A4A4A] text-center pb-4">
        This simulator is an educational awareness tool for itinerant professionals and caregivers.
        It does not replicate the full experience of hearing loss and should not be used for clinical assessment or diagnosis.
      </p>

    </div>
  );
}