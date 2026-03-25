import React, { useState, useRef, useCallback, useEffect } from "react";
import { Ear, Mic, Square, Play, AlertCircle, Info, Volume2, RefreshCw, ArrowLeftRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import StudentAudiogramLoader from "../components/simulator/StudentAudiogramLoader";
import WaveformComparison from "../components/simulator/WaveformComparison";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

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

const STATIC_NOISE_NONE = { id: "none", label: "None", description: "No background noise added.", profile: { gain: 0, lowShelfGain: 0, highShelfGain: 0 } };

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

async function applyFiltersUnilateral(audioCtx, inputBuffer, gainValues, affectedEar) {
  const offlineCtx = new OfflineAudioContext(2, inputBuffer.length, inputBuffer.sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = inputBuffer;
  const splitter = offlineCtx.createChannelSplitter(2);
  const merger = offlineCtx.createChannelMerger(2);
  const filters = gainValues.map((gain, i) => {
    const f = offlineCtx.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = BAND_FREQUENCIES[i];
    f.Q.value = 1.4;
    f.gain.value = gain;
    return f;
  });
  for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
  source.connect(splitter);
  const affectedChannelIndex = affectedEar === "right" ? 1 : 0;
  const clearChannelIndex = affectedEar === "right" ? 0 : 1;
  splitter.connect(merger, clearChannelIndex, clearChannelIndex);
  splitter.connect(filters[0], affectedChannelIndex);
  filters[filters.length - 1].connect(merger, 0, affectedChannelIndex);
  merger.connect(offlineCtx.destination);
  source.start(0);
  return offlineCtx.startRendering();
}

function generateNoiseMix(audioCtx, durationSeconds, sampleRate, noiseProfile) {
  const frameCount = Math.ceil(durationSeconds * sampleRate);
  const buffer = audioCtx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = (Math.random() * 2 - 1) * noiseProfile.gain;
  }
  return buffer;
}

async function renderNoiseMixed(audioCtx, filteredBuffer, noiseProfile) {
  if (!noiseProfile || noiseProfile.gain === 0) return filteredBuffer;
  const offlineCtx = new OfflineAudioContext(filteredBuffer.numberOfChannels, filteredBuffer.length, filteredBuffer.sampleRate);
  const speechSrc = offlineCtx.createBufferSource();
  speechSrc.buffer = filteredBuffer;
  const noiseBuffer = generateNoiseMix(offlineCtx, filteredBuffer.duration, filteredBuffer.sampleRate, noiseProfile);
  const noiseSrc = offlineCtx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = true;
  const lowShelf = offlineCtx.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 800;
  lowShelf.gain.value = noiseProfile.lowShelfGain;
  const highShelf = offlineCtx.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.value = 3000;
  highShelf.gain.value = noiseProfile.highShelfGain;
  const noiseGain = offlineCtx.createGain();
  noiseGain.gain.value = 1.0;
  noiseSrc.connect(lowShelf);
  lowShelf.connect(highShelf);
  highShelf.connect(noiseGain);
  noiseGain.connect(offlineCtx.destination);
  speechSrc.connect(offlineCtx.destination);
  speechSrc.start(0);
  noiseSrc.start(0);
  return offlineCtx.startRendering();
}

async function renderNoiseMixedFromBuffer(audioCtx, speechBuffer, noiseBuffer, noiseProfile) {
  const offlineCtx = new OfflineAudioContext(speechBuffer.numberOfChannels, speechBuffer.length, speechBuffer.sampleRate);

  const speechSrc = offlineCtx.createBufferSource();
  speechSrc.buffer = speechBuffer;

  const noiseSrc = offlineCtx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = true;

  const lowShelf = offlineCtx.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 800;
  lowShelf.gain.value = noiseProfile.lowShelfGain;

  const highShelf = offlineCtx.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.value = 3000;
  highShelf.gain.value = noiseProfile.highShelfGain;

  const noiseGain = offlineCtx.createGain();
  noiseGain.gain.value = noiseProfile.gain;

  noiseSrc.connect(lowShelf);
  lowShelf.connect(highShelf);
  highShelf.connect(noiseGain);
  noiseGain.connect(offlineCtx.destination);
  speechSrc.connect(offlineCtx.destination);

  speechSrc.start(0);
  noiseSrc.start(0);
  return offlineCtx.startRendering();
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function HearingLossSimulator() {
  const { data: dbEnvironments = [] } = useQuery({
    queryKey: ["audioEnvironments"],
    queryFn: () => base44.entities.AudioEnvironment.list("order"),
  });

  // Combine static "None" with DB environments
  const NOISE_ENVIRONMENTS = [
    STATIC_NOISE_NONE,
    ...dbEnvironments.map(e => ({
      id: e.id,
      label: e.name,
      description: e.description || "",
      fileUrl: e.fileUrl,
      profile: { gain: e.gain ?? 0.3, lowShelfGain: e.lowShelfGain ?? 6, highShelfGain: e.highShelfGain ?? -12 },
    })),
  ];

  // status: idle | recording | processing | ready | playing_normal | playing_simulated | error | permission_denied
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePresetId, setActivePresetId] = useState("mild_hf");
  const [customGains, setCustomGains] = useState(PRESETS.find(p => p.id === "mild_hf").gains.slice());
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [playingMode, setPlayingMode] = useState(null); // 'normal' | 'simulated'
  const [studentSimLabel, setStudentSimLabel] = useState(null);
  const [studentSimInterpretation, setStudentSimInterpretation] = useState(null);
  const [laterality, setLaterality] = useState("bilateral");
  const [noiseEnvId, setNoiseEnvId] = useState("none");
  // Mirror state for canvas re-renders (refs don't trigger renders)
  const [rawBufferState, setRawBufferState] = useState(null);
  const [filteredBufferState, setFilteredBufferState] = useState(null);

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

  // ── Build filtered buffer (full pipeline: HL filters + optional noise) ────
  const buildFilteredBuffer = useCallback(async (rawBuffer, gains, lat, noiseId, noiseEnvs) => {
    const ctx = getAudioCtx();
    const envList = noiseEnvs || NOISE_ENVIRONMENTS;
    const selectedEnv = envList.find(e => e.id === noiseId);
    const noiseProfile = selectedEnv?.profile;
    const fileUrl = selectedEnv?.fileUrl;

    const intermediate = lat === "bilateral"
      ? await applyFiltersToBuffer(ctx, rawBuffer, gains)
      : await applyFiltersUnilateral(ctx, rawBuffer, gains, lat);

    if (noiseId === "none" || !noiseProfile) return intermediate;

    // If a real audio file URL is available, decode and mix it
    if (fileUrl) {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const noiseBuffer = await ctx.decodeAudioData(arrayBuffer);
      return await renderNoiseMixedFromBuffer(ctx, intermediate, noiseBuffer, noiseProfile);
    }

    return await renderNoiseMixed(ctx, intermediate, noiseProfile);
  }, [NOISE_ENVIRONMENTS]);

  // ── Sync buffer refs → state so WaveformComparison re-draws ──────────────
  const commitBuffers = useCallback((raw, filtered) => {
    rawBufferRef.current = raw;
    filteredBufferRef.current = filtered;
    setRawBufferState(raw);
    setFilteredBufferState(filtered);
  }, []);

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

      // Pre-render filtered version
      const gains = isCustomMode ? customGains : activePreset.gains;
      const filtered = await buildFilteredBuffer(decoded, gains, laterality, noiseEnvId, NOISE_ENVIRONMENTS);
      commitBuffers(decoded, filtered);

      setStatus("ready");
    };

    recorder.start();
    setStatus("recording");
  }, [activePreset, isCustomMode, customGains, buildFilteredBuffer, laterality, noiseEnvId]);

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
    setRawBufferState(null);
    setFilteredBufferState(null);
    setStatus("idle");
    setPlayingMode(null);
  }, [stopPlayback]);

  // ── Laterality change ──────────────────────────────────────────────────────
  const handleLateralityChange = useCallback(async (newLaterality) => {
    setLaterality(newLaterality);
    if (rawBufferRef.current) {
      setStatus("processing");
      stopPlayback();
      const gains = isCustomMode ? customGains : activePreset?.gains || customGains;
      const filtered = await buildFilteredBuffer(rawBufferRef.current, gains, newLaterality, noiseEnvId, NOISE_ENVIRONMENTS);
      commitBuffers(rawBufferRef.current, filtered);
      setStatus("ready");
    }
  }, [buildFilteredBuffer, commitBuffers, isCustomMode, customGains, activePreset, noiseEnvId, stopPlayback, NOISE_ENVIRONMENTS]);

  // ── Noise environment change ───────────────────────────────────────────────
  const handleNoiseChange = useCallback(async (newNoiseId) => {
    setNoiseEnvId(newNoiseId);
    if (rawBufferRef.current) {
      setStatus("processing");
      stopPlayback();
      const gains = isCustomMode ? customGains : activePreset?.gains || customGains;
      const filtered = await buildFilteredBuffer(rawBufferRef.current, gains, laterality, newNoiseId, NOISE_ENVIRONMENTS);
      commitBuffers(rawBufferRef.current, filtered);
      setStatus("ready");
    }
  }, [buildFilteredBuffer, commitBuffers, isCustomMode, customGains, activePreset, laterality, stopPlayback, NOISE_ENVIRONMENTS]);

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
      const filtered = await buildFilteredBuffer(rawBufferRef.current, gains, laterality, noiseEnvId, NOISE_ENVIRONMENTS);
      commitBuffers(rawBufferRef.current, filtered);
      setStatus("ready");
    }
  }, [stopPlayback, buildFilteredBuffer, commitBuffers, laterality, noiseEnvId, NOISE_ENVIRONMENTS]);

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
      const filtered = await buildFilteredBuffer(rawBufferRef.current, preset.gains, laterality, noiseEnvId, NOISE_ENVIRONMENTS);
      commitBuffers(rawBufferRef.current, filtered);
      setStatus("ready");
    }
  }, [stopPlayback, buildFilteredBuffer, commitBuffers, laterality, noiseEnvId, NOISE_ENVIRONMENTS]);

  // ── Slider change ──────────────────────────────────────────────────────────
  const handleSliderChange = useCallback(async (bandIndex, value) => {
    const newGains = customGains.slice();
    newGains[bandIndex] = value;
    setCustomGains(newGains);
    setIsCustomMode(true);

    if (rawBufferRef.current) {
      stopPlayback();
      const filtered = await buildFilteredBuffer(rawBufferRef.current, newGains, laterality, noiseEnvId, NOISE_ENVIRONMENTS);
      commitBuffers(rawBufferRef.current, filtered);
      if (status === "ready" || status === "playing_normal" || status === "playing_simulated") {
        setStatus("ready");
      }
    }
  }, [customGains, stopPlayback, status, buildFilteredBuffer, commitBuffers, laterality, noiseEnvId, NOISE_ENVIRONMENTS]);

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

        {/* Laterality selector */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1A1028]">Affected Ear</h3>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "bilateral", label: "Both Ears" },
              { id: "right", label: "Right Ear Only" },
              { id: "left", label: "Left Ear Only" },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleLateralityChange(opt.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  laterality === opt.id
                    ? "bg-[#400070] text-white border-[#400070]"
                    : "bg-white text-[#4A4A4A] border-[var(--modal-border)] hover:bg-[#F7F3FA] hover:border-[#C4A8E0]"
                }`}
                aria-pressed={laterality === opt.id}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {laterality !== "bilateral" && (
            <p className="text-xs text-[#4A4A4A]">
              {laterality === "right"
                ? "Right ear hears with the selected hearing loss. Left ear hears normally."
                : "Left ear hears with the selected hearing loss. Right ear hears normally."}
            </p>
          )}
        </div>

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

      {/* Listening Environment card */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1A1028]">Listening Environment</h2>
        <p className="text-xs text-[#4A4A4A]">
          Add procedurally generated background noise to the simulated track only.
          Demonstrates how hearing loss impacts speech understanding in realistic settings.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NOISE_ENVIRONMENTS.map(env => {
            const isActive = noiseEnvId === env.id;
            return (
              <button
                key={env.id}
                onClick={() => handleNoiseChange(env.id)}
                className={`text-left rounded-xl border px-4 py-3 transition-all ${
                  isActive
                    ? "bg-[#EADDF5] border-[#6B2FB9]"
                    : "bg-white border-[var(--modal-border)] hover:bg-[#F7F3FA] hover:border-[#C4A8E0]"
                }`}
                aria-pressed={isActive}
              >
                <p className={`text-sm font-semibold ${isActive ? "text-[#400070]" : "text-[#1A1028]"}`}>{env.label}</p>
                <p className="text-xs text-[#4A4A4A] mt-0.5 leading-snug">{env.description}</p>
              </button>
            );
          })}
        </div>
        {noiseEnvId !== "none" && (
          <p className="text-xs text-[#4A4A4A] bg-[#F7F3FA] rounded-xl px-3 py-2">
            Background noise is added to the <strong>simulated track only</strong>.
            Play Normal vs. Play Simulated to hear the combined effect of hearing loss and environment.
          </p>
        )}
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

      {/* Waveform comparison — shown once a recording is ready */}
      {rawBufferState && filteredBufferState && (
        <WaveformComparison
          rawBuffer={rawBufferState}
          filteredBuffer={filteredBufferState}
          playingMode={playingMode}
        />
      )}

      {/* Disclaimer */}
      <p className="text-xs text-[#4A4A4A] text-center pb-4">
        This simulator is an educational awareness tool for itinerant professionals and caregivers.
        It does not replicate the full experience of hearing loss and should not be used for clinical assessment or diagnosis.
      </p>

    </div>
  );
}