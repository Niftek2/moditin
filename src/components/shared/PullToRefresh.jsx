import React, { useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPulling(true);
      setPullY(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      try { await onRefresh(); } finally {
        setRefreshing(false);
      }
    }
    startY.current = null;
    setPulling(false);
    setPullY(0);
  }, [pullY, refreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pulling || refreshing ? `${refreshing ? THRESHOLD : pullY}px` : 0 }}
        aria-live="polite"
        aria-label={refreshing ? "Refreshing..." : undefined}
      >
        <Loader2
          className={`w-5 h-5 text-[var(--modal-purple)] ${refreshing ? "animate-spin" : ""}`}
          style={!refreshing ? { transform: `rotate(${(pullY / THRESHOLD) * 180}deg)` } : {}}
          aria-hidden="true"
        />
      </div>
      {children}
    </div>
  );
}