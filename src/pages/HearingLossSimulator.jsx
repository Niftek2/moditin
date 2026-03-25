import React, { useState, useRef, useCallback, useEffect } from "react";
import { Ear, Mic, Square, Play, AlertCircle, Info, Volume2, RefreshCw, ArrowLeftRight } from "lucide-react";
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

const BAND_FREQUENCIES_LABELS = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"];
const DB_HL_MIN = -10;
const DB_HL_MAX = 120;

// Speech banana: approximate upper and lower dB HL bounds per frequency band
const SPEECH_BANANA = [
  { freqIndex: 0, top: 20, bottom: 55 },  // 250 Hz
  { freqIndex: 1, top: 20, bottom: 60 },  // 500 Hz
  { freqIndex: 2, top: 20, bottom: 65 },  // 1k Hz
  { freqIndex: 3, top: 20, bottom: 70 },  // 2k Hz
  { freqIndex: 4, top: 25, bottom: 65 },  // 3k Hz
  { freqIndex: 5, top: 30, bottom: 65 },  // 4k Hz
  { freqIndex: 6, top: 35, bottom: 65 },  // 6k Hz
  { freqIndex: 7, top: 40, bottom: 65 },  // 8k Hz
];

// Convert gain value (−60 to 0) → dB HL (0 to 120)
function gainToDbHL(gain) {
  return Math.round((gain * -2) / 5) * 5; // snap to nearest 5
}

// Convert dB HL → gain value (−60 to 0)
function dbHLToGain(dbHL) {
  return Math.max(-60, Math.min(0, -(dbHL / 2)));
}

// Convert dB HL → percentage position within the chart (0% = top = −10 dB, 100% = bottom = 120 dB)
function dbHLToPercent(dbHL) {
  return ((dbHL - DB_HL_MIN) / (DB_HL_MAX - DB_HL_MIN)) * 100;
}

// Convert a pixel Y offset within the chart container → dB HL, snapped to 5 dB
function pixelToDbHL(pixelY, chartHeightPx) {
  const raw = DB_HL_MIN + (pixelY / chartHeightPx) * (DB_HL_MAX - DB_HL_MIN);
  const snapped = Math.round(raw / 5) * 5;
  return Math.max(DB_HL_MIN, Math.min(DB_HL_MAX, snapped));
}

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

async function renderFmMixed(audioCtx, filteredBuffer, noiseProfile) {
  // FM simulation on top of already-filtered (hearing loss applied) speech.
  // Speech is boosted +5 dB. Noise is same character but 75% quieter.
  if (!noiseProfile || noiseProfile.gain === 0) return filteredBuffer;

  const offlineCtx = new OfflineAudioContext(
    filteredBuffer.numberOfChannels,
    filteredBuffer.length,
    filteredBuffer.sampleRate
  );

  // Speech source — boosted +5 dB
  const speechSrc = offlineCtx.createBufferSource();
  speechSrc.buffer = filteredBuffer;
  const speechGain = offlineCtx.createGain();
  speechGain.gain.value = 1.78; // +5 dB = 10^(5/20)
  speechSrc.connect(speechGain);
  speechGain.connect(offlineCtx.destination);

  // Noise — same shaping filters, gain multiplied by 0.25 (75% reduction)
  const fmNoiseProfile = { ...noiseProfile, gain: noiseProfile.gain * 0.25 };
  const noiseBuffer = generateNoiseMix(
    offlineCtx,
    filteredBuffer.duration,
    filteredBuffer.sampleRate,
    fmNoiseProfile
  );
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

  noiseSrc.connect(lowShelf);
  lowShelf.connect(highShelf);
  highShelf.connect(offlineCtx.destination);

  speechSrc.start(0);
  noiseSrc.start(0);

  return offlineCtx.startRendering();
}

async function renderFmMixedFromBuffer(audioCtx, speechBuffer, noiseBuffer, noiseProfile) {
  // FM version of renderNoiseMixedFromBuffer:
  // speech boosted +5 dB, noise GainNode set to 25% of normal level.
  const offlineCtx = new OfflineAudioContext(
    speechBuffer.numberOfChannels,
    speechBuffer.length,
    speechBuffer.sampleRate
  );

  const speechSrc = offlineCtx.createBufferSource();
  speechSrc.buffer = speechBuffer;
  const speechGain = offlineCtx.createGain();
  speechGain.gain.value = 1.78; // +5 dB
  speechSrc.connect(speechGain);
  speechGain.connect(offlineCtx.destination);

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
  noiseGain.gain.value = noiseProfile.gain * 0.25; // 75% reduction

  noiseSrc.connect(lowShelf);
  lowShelf.connect(highShelf);
  highShelf.connect(noiseGain);
  noiseGain.connect(offlineCtx.destination);

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
  const [playingMode, setPlayingMode] = useState(null); // 'normal' | 'simulated' | 'fm'
  const [studentSimLabel, setStudentSimLabel] = useState(null);
  const [studentSimInterpretation, setStudentSimInterpretation] = useState(null);
  const [laterality, setLaterality] = useState("bilateral");
  const [noiseEnvId, setNoiseEnvId] = useState("none");
  const [activeAudiogramEar, setActiveAudiogramEar] = useState("right"); // "right" | "left"
  // Mirror state for canvas re-renders (refs don't trigger renders)
  const [rawBufferState, setRawBufferState] = useState(null);
  const [filteredBufferState, setFilteredBufferState] = useState(null);
  const fmBufferRef = useRef(null);
  const [fmBufferState, setFmBufferState] = useState(null);

  const audioCtxRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audiogramChartRef = useRef(null); // ref to the chart container div for height measurement
  const draggingRef = useRef(null); // { bandIndex, ear } while a drag is in progress, else null
  const chunksRef = useRef([]);
  const rawBufferRef = useRef(null);       // original recorded AudioBuffer
  const filteredBufferRef = useRef(null);  // filter-processed AudioBuffer
  const playbackSourceRef = useRef(null);

  const activePreset = PRESETS.find(p => p.id === activePresetId);
  const displayGains = isCustomMode ? customGains : activePreset.gains;

  const isReady = ["ready", "playing_normal", "playing_simulated", "playing_fm"].includes(status);

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

  // ── Build FM buffer (same HL + reduced noise + boosted speech) ───────────
  const buildFmBuffer = useCallback(async (filteredBuffer, noiseId, noiseEnvs) => {
    const ctx = getAudioCtx();
    const envList = noiseEnvs || NOISE_ENVIRONMENTS;
    const selectedEnv = envList.find(e => e.id === noiseId);
    const noiseProfile = selectedEnv?.profile;
    const fileUrl = selectedEnv?.fileUrl;

    if (noiseId === "none" || !noiseProfile || noiseProfile.gain === 0) return null;

    if (fileUrl) {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const noiseBuffer = await ctx.decodeAudioData(arrayBuffer);
      return await renderFmMixedFromBuffer(ctx, filteredBuffer, noiseBuffer, noiseProfile);
    }

    return await renderFmMixed(ctx, filteredBuffer, noiseProfile);
  }, [NOISE_ENVIRONMENTS]);

  // ── Sync buffer refs → state so WaveformComparison re-draws ──────────────
  const commitBuffers = useCallback(async (raw, filtered, noiseId, noiseEnvs) => {
    rawBufferRef.current = raw;
    filteredBufferRef.current = filtered;
    setRawBufferState(raw);
    setFilteredBufferState(filtered);

    // Build FM buffer in parallel — null when noise is "none"
    const fm = await buildFmBuffer(filtered, noiseId, noiseEnvs);
    fmBufferRef.current = fm;
    setFmBufferState(fm);
  }, [buildFmBuffer]);

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
      await commitBuffers(decoded, filtered, noiseEnvId, NOISE_ENVIRONMENTS);

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

  const handlePlayFm = useCallback(() => {
    if (!fmBufferRef.current) return;
    if (playingMode === "fm") { stopPlayback(); return; }
    if (playbackSourceRef.current) {
      try { playbackSourceRef.current.stop(); } catch {}
      playbackSourceRef.current = null;
    }
    const ctx = getAudioCtx();
    const src = ctx.createBufferSource();
    src.buffer = fmBufferRef.current;
    src.connect(ctx.destination);
    src.onended = () => {
      playbackSourceRef.current = null;
      setPlayingMode(null);
      setStatus("ready");
    };
    src.start(0);
    playbackSourceRef.current = src;
    setPlayingMode("fm");
    setStatus("playing_fm");
  }, [stopPlayback, playingMode]);

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
    fmBufferRef.current = null;
    setRawBufferState(null);
    setFilteredBufferState(null);
    setFmBufferState(null);
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
      await commitBuffers(rawBufferRef.current, filtered, noiseEnvId, NOISE_ENVIRONMENTS);
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
      await commitBuffers(rawBufferRef.current, filtered, newNoiseId, NOISE_ENVIRONMENTS);
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
      await commitBuffers(rawBufferRef.current, filtered, noiseEnvId, NOISE_ENVIRONMENTS);
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
      await commitBuffers(rawBufferRef.current, filtered, noiseEnvId, NOISE_ENVIRONMENTS);
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
      await commitBuffers(rawBufferRef.current, filtered, noiseEnvId, NOISE_ENVIRONMENTS);
      if (status === "ready" || status === "playing_normal" || status === "playing_simulated") {
        setStatus("ready");
      }
    }
  }, [customGains, stopPlayback, status, buildFilteredBuffer, commitBuffers, laterality, noiseEnvId, NOISE_ENVIRONMENTS]);

  // ── Audiogram drag handlers ────────────────────────────────────────────────
  const handleMarkerDragStart = useCallback((e, bandIndex) => {
    e.preventDefault();
    draggingRef.current = { bandIndex, ear: activeAudiogramEar };
  }, [activeAudiogramEar]);

  const handleChartPointerMove = useCallback((e) => {
    if (!draggingRef.current || !audiogramChartRef.current) return;
    const rect = audiogramChartRef.current.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const relY = clientY - rect.top;
    const dbHL = pixelToDbHL(relY, rect.height);
    const gain = dbHLToGain(dbHL);
    handleSliderChange(draggingRef.current.bandIndex, gain);
  }, [handleSliderChange]);

  const handleChartPointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

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

      {/* Manual Adjustment — Interactive Audiogram */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-[#1A1028]">Manual Adjustment</h2>
          <div className="flex items-center gap-2">
            {isCustomMode && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EADDF5] text-[#6B2FB9]">Custom</span>
            )}
          </div>
        </div>

        <p className="text-xs text-[#4A4A4A]">
          Drag the markers on the audiogram to set hearing thresholds per frequency.
          The shaded region is the <strong>speech banana</strong> — where most speech sounds occur.
          Changes re-process the recording automatically.
        </p>

        {/* Ear selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#4A4A4A]">Editing ear:</span>
          <button
            onClick={() => setActiveAudiogramEar("right")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeAudiogramEar === "right"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-[#4A4A4A] border-[var(--modal-border)] hover:border-red-300"
            }`}
            aria-pressed={activeAudiogramEar === "right"}
          >
            Right Ear (O)
          </button>
          <button
            onClick={() => setActiveAudiogramEar("left")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeAudiogramEar === "left"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-[#4A4A4A] border-[var(--modal-border)] hover:border-blue-300"
            }`}
            aria-pressed={activeAudiogramEar === "left"}
          >
            Left Ear (X)
          </button>
        </div>

        {/* Audiogram chart */}
        <div className="relative select-none" style={{ paddingLeft: "36px", paddingBottom: "20px" }}>

          {/* Y-axis dB labels */}
          <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between" style={{ width: "32px" }}>
            {[-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(db => (
              <span key={db} className="text-[9px] text-[#4A4A4A] text-right leading-none" style={{ lineHeight: 1 }}>
                {db}
              </span>
            ))}
          </div>

          {/* Chart area */}
          <div
            ref={audiogramChartRef}
            className="relative border border-[var(--modal-border)] rounded-xl overflow-hidden"
            style={{ height: "280px", cursor: "default" }}
            onMouseMove={handleChartPointerMove}
            onMouseUp={handleChartPointerUp}
            onMouseLeave={handleChartPointerUp}
            onTouchMove={handleChartPointerMove}
            onTouchEnd={handleChartPointerUp}
          >
            {/* Horizontal grid lines — one per 10 dB */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(db => (
              <div
                key={db}
                className="absolute left-0 right-0"
                style={{
                  top: `${dbHLToPercent(db)}%`,
                  height: "1px",
                  backgroundColor: db % 20 === 0 ? "#C0B8CC" : "#EDE8F4",
                }}
              />
            ))}

            {/* Normal hearing range shading (−10 to 25 dB) */}
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `${dbHLToPercent(-10)}%`,
                height: `${dbHLToPercent(25) - dbHLToPercent(-10)}%`,
                backgroundColor: "rgba(200, 230, 200, 0.35)",
              }}
            />

            {/* Speech banana — per-column trapezoid approximation using flex columns */}
            <div className="absolute inset-0 flex pointer-events-none">
              {SPEECH_BANANA.map((band) => (
                <div key={band.freqIndex} className="flex-1 relative">
                  <div
                    className="absolute left-0 right-0"
                    style={{
                      top: `${dbHLToPercent(band.top)}%`,
                      height: `${dbHLToPercent(band.bottom) - dbHLToPercent(band.top)}%`,
                      backgroundColor: "rgba(250, 220, 100, 0.30)",
                      borderTop: "1px dashed rgba(200, 160, 0, 0.4)",
                      borderBottom: "1px dashed rgba(200, 160, 0, 0.4)",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Frequency columns + markers */}
            <div className="absolute inset-0 flex">
              {BAND_FREQUENCIES_LABELS.map((label, i) => {
                const rightDbHL = gainToDbHL(displayGains[i]);
                const leftDbHL = gainToDbHL(displayGains[i]);
                const rightTop = dbHLToPercent(rightDbHL);
                const leftTop = dbHLToPercent(leftDbHL);
                const isActiveCol = draggingRef.current?.bandIndex === i;

                return (
                  <div
                    key={label}
                    className={`flex-1 relative border-l border-[#EDE8F4] first:border-l-0 ${isActiveCol ? "bg-[#F7F3FA]" : ""}`}
                  >
                    {/* Column frequency label at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                      <span className="text-[9px] text-[#4A4A4A] font-semibold translate-y-full pt-1">{label}</span>
                    </div>

                    {/* Right ear marker — O (open circle) */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none z-20"
                      style={{ top: `${rightTop}%` }}
                      onMouseDown={(e) => handleMarkerDragStart(e, i)}
                      onTouchStart={(e) => handleMarkerDragStart(e, i)}
                      aria-label={`Right ear ${label}Hz: ${rightDbHL} dB HL`}
                      role="slider"
                      aria-valuenow={rightDbHL}
                      aria-valuemin={DB_HL_MIN}
                      aria-valuemax={DB_HL_MAX}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 transition-shadow ${
                          activeAudiogramEar === "right"
                            ? "border-red-600 bg-white shadow-md hover:shadow-lg"
                            : "border-red-300 bg-white opacity-60"
                        }`}
                      />
                    </div>

                    {/* Left ear marker — X */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none z-20"
                      style={{ top: `${leftTop}%`, marginLeft: "2px" }}
                      onMouseDown={(e) => handleMarkerDragStart(e, i)}
                      onTouchStart={(e) => handleMarkerDragStart(e, i)}
                      aria-label={`Left ear ${label}Hz: ${leftDbHL} dB HL`}
                      role="slider"
                      aria-valuenow={leftDbHL}
                      aria-valuemin={DB_HL_MIN}
                      aria-valuemax={DB_HL_MAX}
                    >
                      <div
                        className={`w-5 h-5 flex items-center justify-center font-bold transition-opacity ${
                          activeAudiogramEar === "left"
                            ? "text-blue-600 opacity-100"
                            : "text-blue-300 opacity-60"
                        }`}
                        style={{ fontSize: "16px", lineHeight: 1, userSelect: "none" }}
                      >
                        ×
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis label */}
          <p className="text-center text-[10px] text-[#4A4A4A] mt-5">Frequency (Hz)</p>
        </div>

        {/* Y-axis label */}
        <p className="text-[10px] text-[#4A4A4A] text-center -mt-2">↑ Better hearing &nbsp;|&nbsp; dB HL &nbsp;|&nbsp; More loss ↓</p>

        {/* Legend */}
        <div className="flex items-center gap-5 flex-wrap pt-1">
          <div className="flex items-center gap-2 text-xs text-[#4A4A4A]">
            <div className="w-4 h-4 rounded-full border-2 border-red-600 bg-white" />
            Right ear
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4A4A4A]">
            <span className="text-blue-600 font-bold text-base leading-none">×</span>
            Left ear
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4A4A4A]">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "rgba(250, 220, 100, 0.5)", border: "1px dashed rgba(200,160,0,0.5)" }} />
            Speech banana
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4A4A4A]">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "rgba(200, 230, 200, 0.5)" }} />
            Normal range
          </div>
        </div>

        {/* Current threshold readout */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1">
          {BAND_FREQUENCIES_LABELS.map((label, i) => (
            <div key={label} className="text-center bg-[#F7F3FA] rounded-lg py-1.5 px-1 border border-[var(--modal-border)]">
              <p className="text-[9px] font-semibold text-[#4A4A4A]">{label}</p>
              <p className="text-[10px] font-mono font-bold text-[#1A1028]">{gainToDbHL(displayGains[i])}</p>
              <p className="text-[8px] text-[#4A4A4A]">dB HL</p>
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
            <div className={`grid gap-3 ${fmBufferState ? "grid-cols-3" : "grid-cols-2"}`}>
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

              {/* FM Mic — only shown when a noise environment is active */}
              {fmBufferState && (
                <button
                  onClick={handlePlayFm}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-5 transition-all font-semibold text-sm ${
                    playingMode === "fm"
                      ? "bg-emerald-700 border-emerald-700 text-white"
                      : "bg-white border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {playingMode === "fm" ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                  <span className="text-center leading-tight">With FM Mic</span>
                  <span className="text-xs font-normal opacity-70">SNR improved</span>
                </button>
              )}
            </div>

            {!fmBufferState && noiseEnvId === "none" && (
              <p className="text-xs text-[#4A4A4A] mt-2 text-center">
                Select a listening environment above to enable the FM Mic comparison.
              </p>
            )}

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