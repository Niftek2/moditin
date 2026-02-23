// Canonical utilities for Ling 6 module

export const LING6_SOUNDS = ["m", "oo", "ah", "ee", "sh", "s"];

export const SOUND_LABELS = {
  m: "/m/",
  oo: "/oo/",
  ah: "/ah/",
  ee: "/ee/",
  sh: "/sh/",
  s: "/s/",
};

// Each sound uses a publicly available AudioContext-generated tone approximation
// Since we can't bundle audio files, we synthesize tones using Web Audio API
// These are pedagogically simplified representations
export const SOUND_FREQUENCIES = {
  m: 200,   // nasal, low
  oo: 400,  // rounded vowel
  ah: 900,  // open vowel
  ee: 2500, // high front vowel
  sh: 3000, // fricative
  s: 4000,  // high fricative
};

export const SOUND_TYPES = {
  m: "oscillator",
  oo: "oscillator",
  ah: "oscillator",
  ee: "oscillator",
  sh: "noise",
  s: "noise",
};

/** Compute summary stats from a list of Ling6Trial objects */
export function computeSummary(trials) {
  if (!trials || trials.length === 0) {
    return { detected: 0, identified: 0, detectedPct: 0, identifiedPct: 0, bySound: {} };
  }

  // Group by sound, use "best" trial per sound
  const bySound = {};
  LING6_SOUNDS.forEach(sound => {
    const soundTrials = trials.filter(t => t.sound === sound);
    if (soundTrials.length === 0) {
      bySound[sound] = { status: "NotTested", trialCount: 0 };
      return;
    }
    // Best response wins
    const hasBest = (type) => soundTrials.some(t => t.responseType === type);
    let status = "NoResponse";
    if (hasBest("Identified")) status = "Identified";
    else if (hasBest("Detected")) status = "Detected";
    else if (hasBest("Incorrect")) status = "Incorrect";
    bySound[sound] = { status, trialCount: soundTrials.length, trials: soundTrials };
  });

  const tested = LING6_SOUNDS.filter(s => bySound[s].status !== "NotTested");
  const testedCount = tested.length;
  const detectedCount = tested.filter(s => bySound[s].status === "Detected" || bySound[s].status === "Identified").length;
  const identifiedCount = tested.filter(s => bySound[s].status === "Identified").length;

  return {
    detected: detectedCount,
    identified: identifiedCount,
    testedCount,
    detectedPct: testedCount > 0 ? Math.round((detectedCount / testedCount) * 100) : 0,
    identifiedPct: testedCount > 0 ? Math.round((identifiedCount / testedCount) * 100) : 0,
    bySound,
  };
}

export function soundStatusColor(status) {
  switch (status) {
    case "Identified": return "bg-green-100 border-green-400 text-green-800";
    case "Detected": return "bg-yellow-100 border-yellow-400 text-yellow-800";
    case "NoResponse": return "bg-gray-100 border-gray-300 text-gray-500";
    case "Incorrect": return "bg-red-100 border-red-400 text-red-700";
    default: return "bg-white border-[var(--modal-border)] text-[var(--modal-text-muted)]";
  }
}

export function soundStatusDotColor(status) {
  switch (status) {
    case "Identified": return "bg-green-500";
    case "Detected": return "bg-yellow-400";
    case "NoResponse": return "bg-gray-400";
    case "Incorrect": return "bg-red-400";
    default: return "bg-gray-200";
  }
}

export const LING6_SOUND_URLS = {
  m: "https://base44.app/api/apps/6998a9f042c4eb98ea121183/files/public/6998a9f042c4eb98ea121183/98bc19829_Mmm.mp3",
  oo: "https://base44.app/api/apps/6998a9f042c4eb98ea121183/files/public/6998a9f042c4eb98ea121183/c4969b517_ooomp3.mp3",
  ah: "https://base44.app/api/apps/6998a9f042c4eb98ea121183/files/public/6998a9f042c4eb98ea121183/cbf8b4e10_Aaaa.mp3",
  ee: "https://base44.app/api/apps/6998a9f042c4eb98ea121183/files/public/6998a9f042c4eb98ea121183/8f947fdc8_eeemp3.mp3",
  sh: "https://base44.app/api/apps/6998a9f042c4eb98ea121183/files/public/6998a9f042c4eb98ea121183/c70c6d691_Shh.mp3",
  s: "https://base44.app/api/apps/6998a9f042c4eb98ea121183/files/public/6998a9f042c4eb98ea121183/bdd1bb57e_SSmp3.mp3",
};

/** Play a real MP3 clip for a Ling 6 sound, falling back to synthetic tone */
export function playLing6Sound(sound, onEnd) {
  const url = LING6_SOUND_URLS[sound];
  if (url) {
    const audio = new Audio(url);
    audio.onended = () => { if (onEnd) onEnd(); };
    audio.onerror = () => _playLing6SoundSynthetic(sound, onEnd);
    audio.play();
    return;
  }
  _playLing6SoundSynthetic(sound, onEnd);
}

/** Synthetic fallback tone */
function _playLing6SoundSynthetic(sound, onEnd) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const freq = SOUND_FREQUENCIES[sound];
  const type = SOUND_TYPES[sound];
  const duration = 1.2;

  if (type === "noise") {
    // White noise filtered to approximate fricative
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const biquad = ctx.createBiquadFilter();
    biquad.type = "bandpass";
    biquad.frequency.value = freq;
    biquad.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(biquad);
    biquad.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration);
    source.onended = () => { ctx.close(); if (onEnd) onEnd(); };
  } else {
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    oscillator.onended = () => { ctx.close(); if (onEnd) onEnd(); };
  }
}