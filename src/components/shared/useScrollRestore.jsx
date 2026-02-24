import { useEffect, useRef } from "react";

const scrollCache = {};

/**
 * Saves and restores window scroll position per page key.
 * Call at the top of any page component to get persistent scroll on tab switches.
 */
export function useScrollRestore(pageKey) {
  const isMounted = useRef(false);

  useEffect(() => {
    // Restore saved position on mount
    const saved = scrollCache[pageKey];
    if (saved !== undefined) {
      // Small delay allows content to render before restoring
      requestAnimationFrame(() => window.scrollTo(0, saved));
    }
    isMounted.current = true;

    const handleScroll = () => {
      if (isMounted.current) {
        scrollCache[pageKey] = window.scrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      isMounted.current = false;
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pageKey]);
}