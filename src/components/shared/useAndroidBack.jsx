import { useEffect } from "react";

/**
 * Intercepts the Android hardware back button (popstate event triggered by
 * the WebView) and navigates browser history instead of closing the app.
 */
export function useAndroidBack() {
  useEffect(() => {
    // Push a sentinel state so the first back press hits history.back()
    // rather than popping out of the WebView.
    window.history.pushState({ _sentinel: true }, "");

    const handlePopState = (e) => {
      // Re-push the sentinel so subsequent presses also work
      window.history.pushState({ _sentinel: true }, "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
}