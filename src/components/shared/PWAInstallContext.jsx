import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const PWAInstallContext = createContext({ canInstall: false, promptInstall: async () => false });

export function PWAInstallProvider({ children }) {
  const deferredPrompt = useRef(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const evt = deferredPrompt.current;
    if (!evt) return false;
    evt.prompt();
    try {
      await evt.userChoice;
    } catch {}
    deferredPrompt.current = null;
    setCanInstall(false);
    return true;
  }, []);

  return (
    <PWAInstallContext.Provider value={{ canInstall, promptInstall }}>
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  return useContext(PWAInstallContext);
}