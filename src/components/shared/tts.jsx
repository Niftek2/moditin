/**
 * TTS Service - Cross-platform Text-to-Speech using native APIs
 * Web: Web Speech API (SpeechSynthesis)
 */

let currentUtterance = null;

/**
 * Check if TTS is supported on this device/browser
 */
export function isSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

/**
 * Speak text with given rate
 * @param {string} text - Text to speak
 * @param {number} rate - Speech rate (0.75, 1.0, 1.25)
 * @returns {Promise<void>}
 */
export async function speak(text, rate = 1.0) {
  if (!isSupported()) {
    console.warn("TTS not supported on this device");
    return;
  }

  // Stop any current speech
  stop();

  try {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Store reference for stop function
    currentUtterance = utterance;

    // Speak
    synth.speak(utterance);
  } catch (error) {
    console.error("TTS error:", error);
  }
}

/**
 * Stop current speech
 */
export function stop() {
  try {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      currentUtterance = null;
    }
  } catch (error) {
    console.error("TTS stop error:", error);
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking() {
  try {
    return window.speechSynthesis?.speaking || false;
  } catch {
    return false;
  }
}

/**
 * Apply user settings to speech
 * @param {Object} settings - UserAudioSettings object
 * @param {string} text - Text to speak
 */
export async function speakWithSettings(text, settings) {
  if (!settings?.enabled) return;
  
  const rate = settings.rate || 1.0;
  await speak(text, rate);
}