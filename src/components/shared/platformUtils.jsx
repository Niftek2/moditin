/**
 * Detects if the app is running inside an Apple/iOS native WebView.
 * This is used to hide Stripe pricing UI for App Store compliance.
 */
export function isIosPlatform() {
  const ua = navigator.userAgent || "";
  // Matches iPhone/iPad/iPod in mobile Safari or a native WebView
  const isIos = /iPhone|iPad|iPod/.test(ua);
  // In a native WKWebView, "Safari" is absent from the UA
  const isNativeWebView = isIos && !/Safari/.test(ua);
  // Also check for standalone mode (added to home screen)
  const isStandalone = window.navigator.standalone === true;
  return isNativeWebView || (isIos && isStandalone);
}