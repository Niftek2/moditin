/**
 * TTS Service — uses Speechify (custom Nadia voice) via backend function.
 * Falls back to native SpeechSynthesis only if Speechify fails.
 */
import { base44 } from "@/api/base44Client";

let currentAudio = null;
let currentToken = 0;

export function isSupported() {
  return typeof window !== "undefined";
}

/**
 * Speak text via Speechify (Nadia voice) with adjustable rate.
 * @param {string} text
 * @param {number} rate - 0.5 to 2.0 (default 1.0)
 */
export async function speak(text, rate = 1.0) {
  if (!text || !isSupported()) return;
  stop();

  const token = ++currentToken;
  try {
    const res = await base44.functions.invoke("speechifyTts", { text, rate });
    if (token !== currentToken) return; // a newer speak() superseded us

    const audioUrl = res?.data?.audioUrl;
    if (!audioUrl) throw new Error("No audio returned");

    const audio = new Audio(audioUrl);
    audio.playbackRate = 1.0; // rate is already baked into the audio via SSML
    currentAudio = audio;
    audio.onended = () => { if (currentAudio === audio) currentAudio = null; };
    await audio.play();
  } catch (error) {
    console.error("Speechify TTS failed, falling back to browser:", error);
    if (token === currentToken) fallbackSpeak(text, rate);
  }
}

function fallbackSpeak(text, rate) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

export function stop() {
  currentToken++; // invalidate any in-flight fetch
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    console.error("TTS stop error:", e);
  }
}

export function isSpeaking() {
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) return true;
  if (typeof window !== "undefined" && window.speechSynthesis?.speaking) return true;
  return false;
}

export async function speakWithSettings(text, settings) {
  if (!settings?.enabled) return;
  await speak(text, settings.rate || 1.0);
}