import React, { useRef, useEffect } from "react";

/**
 * Renders the original and filtered AudioBuffer waveforms side-by-side on
 * an HTML5 Canvas so users can see the amplitude/complexity reduction caused
 * by the selected hearing-loss preset.
 *
 * Props:
 *   rawBuffer      – AudioBuffer  (original recording)
 *   filteredBuffer – AudioBuffer  (after HL filters + optional noise)
 *   playingMode    – null | 'normal' | 'simulated'  (highlights active side)
 */
export default function WaveformComparison({ rawBuffer, filteredBuffer, playingMode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rawBuffer || !filteredBuffer) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // ── helpers ──────────────────────────────────────────────────────────────
    const PADDING = 12;
    const LABEL_H = 22;
    const halfW = W / 2;
    const waveW = halfW - PADDING * 1.5;
    const waveH = H - LABEL_H - PADDING * 2;
    const midY = LABEL_H + PADDING + waveH / 2;

    function downsample(buffer, targetSamples) {
      // Mix all channels down to mono
      const nCh = buffer.numberOfChannels;
      const len = buffer.length;
      const step = Math.max(1, Math.floor(len / targetSamples));
      const out = [];
      for (let i = 0; i < len; i += step) {
        let v = 0;
        for (let c = 0; c < nCh; c++) v += buffer.getChannelData(c)[i];
        out.push(v / nCh);
      }
      return out;
    }

    function drawWaveform(samples, xOffset, color, isActive) {
      const n = samples.length;
      const xScale = waveW / n;

      // Background panel
      ctx.fillStyle = isActive ? "rgba(64,0,112,0.04)" : "rgba(247,243,250,0.6)";
      ctx.beginPath();
      ctx.roundRect(xOffset, LABEL_H + PADDING - 4, waveW, waveH + 8, 10);
      ctx.fill();

      // Centre line
      ctx.strokeStyle = isActive ? "rgba(107,47,185,0.18)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xOffset, midY);
      ctx.lineTo(xOffset + waveW, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waveform fill
      const grad = ctx.createLinearGradient(xOffset, LABEL_H + PADDING, xOffset, LABEL_H + PADDING + waveH);
      if (isActive) {
        grad.addColorStop(0, "rgba(64,0,112,0.55)");
        grad.addColorStop(0.5, "rgba(107,47,185,0.35)");
        grad.addColorStop(1, "rgba(64,0,112,0.55)");
      } else {
        grad.addColorStop(0, "rgba(100,100,120,0.4)");
        grad.addColorStop(0.5, "rgba(100,100,120,0.2)");
        grad.addColorStop(1, "rgba(100,100,120,0.4)");
      }

      ctx.beginPath();
      ctx.moveTo(xOffset, midY);
      for (let i = 0; i < n; i++) {
        const x = xOffset + i * xScale;
        const y = midY - samples[i] * (waveH / 2) * 0.9;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      // Mirror bottom half
      for (let i = n - 1; i >= 0; i--) {
        const x = xOffset + i * xScale;
        const y = midY + samples[i] * (waveH / 2) * 0.9;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Waveform stroke
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xOffset + i * xScale;
        const y = midY - samples[i] * (waveH / 2) * 0.9;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = isActive ? "rgba(64,0,112,0.75)" : "rgba(80,80,100,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── RMS badge ─────────────────────────────────────────────────────────────
    function rms(buffer) {
      const ch = buffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
      return Math.sqrt(sum / ch.length);
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    const TARGET = Math.min(rawBuffer.length, 1200);
    const rawSamples = downsample(rawBuffer, TARGET);
    const filtSamples = downsample(filteredBuffer, TARGET);

    const normalActive = playingMode === "normal" || playingMode === null;
    const simActive = playingMode === "simulated" || playingMode === null;

    // Left: original
    drawWaveform(rawSamples, PADDING, "#555", normalActive);
    // Right: filtered
    drawWaveform(filtSamples, halfW + PADDING / 2, "#400070", simActive);

    // Labels
    const normalLabelActive = playingMode === "normal";
    const simLabelActive = playingMode === "simulated";

    function drawLabel(text, x, isActive) {
      ctx.font = `600 11px -apple-system, sans-serif`;
      ctx.fillStyle = isActive ? "#400070" : "#777";
      ctx.textAlign = "center";
      ctx.fillText(text, x, 14);
    }

    drawLabel("Normal Hearing", PADDING + waveW / 2, normalLabelActive);
    drawLabel("Simulated Loss", halfW + PADDING / 2 + waveW / 2, simLabelActive);

    // RMS reduction badge on the right panel
    const rawRms = rms(rawBuffer);
    const filtRms = rms(filteredBuffer);
    const reductionDb = rawRms > 0 ? Math.round(20 * Math.log10(filtRms / rawRms)) : 0;
    if (reductionDb < 0) {
      const badgeX = halfW + PADDING / 2 + waveW - 4;
      const badgeY = LABEL_H + PADDING + waveH - 6;
      const label = `${reductionDb} dB`;
      ctx.font = "bold 10px monospace";
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(64,0,112,0.12)";
      ctx.beginPath();
      ctx.roundRect(badgeX - tw - 10, badgeY - 13, tw + 14, 17, 5);
      ctx.fill();
      ctx.fillStyle = "#400070";
      ctx.textAlign = "right";
      ctx.fillText(label, badgeX, badgeY);
    }

    // Divider
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(halfW, LABEL_H);
    ctx.lineTo(halfW, H - PADDING);
    ctx.stroke();

  }, [rawBuffer, filteredBuffer, playingMode]);

  if (!rawBuffer || !filteredBuffer) return null;

  return (
    <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-4 shadow-sm">
      <h2 className="text-sm font-bold text-[#1A1028] mb-3">Waveform Comparison</h2>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 120, display: "block" }}
        aria-label="Side-by-side waveform comparison of original and simulated hearing loss audio"
      />
      <p className="text-xs text-[#4A4A4A] mt-2 text-center">
        Left: original recording · Right: with hearing loss applied
        {rawBuffer && filteredBuffer && (() => {
          const rawCh = rawBuffer.getChannelData(0);
          const filtCh = filteredBuffer.getChannelData(0);
          let sr = 0, sf = 0;
          for (let i = 0; i < rawCh.length; i++) sr += rawCh[i] * rawCh[i];
          for (let i = 0; i < filtCh.length; i++) sf += filtCh[i] * filtCh[i];
          const db = Math.round(20 * Math.log10(Math.sqrt(sf / filtCh.length) / Math.sqrt(sr / rawCh.length)));
          return db < 0 ? ` · ${db} dB amplitude reduction` : "";
        })()}
      </p>
    </div>
  );
}