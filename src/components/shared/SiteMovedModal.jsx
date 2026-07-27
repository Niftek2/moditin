import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const NEW_SITE_URL = "https://dhhitinerant.com";

export default function SiteMovedModal() {
  const [seconds, setSeconds] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          window.location.href = NEW_SITE_URL;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="This site has moved"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div
          className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, #400070 0%, #6B2FB9 100%)" }}
        >
          <ArrowRight className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#1A1028] mb-2">We've Moved!</h2>
        <p className="text-[#4A4A4A] mb-1">
          Modal Itinerant is now located at our new home:
        </p>
        <p className="font-bold text-[#400070] text-lg mb-4">dhhitinerant.com</p>
        <p className="text-sm text-[#4A4A4A] mb-6">
          Your account and all of your data are waiting for you there. You'll be
          redirected automatically in <span className="font-semibold">{seconds}</span> second{seconds === 1 ? "" : "s"}.
        </p>
        <a
          href={NEW_SITE_URL}
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-base"
          style={{ background: "linear-gradient(135deg, #400070 0%, #6B2FB9 100%)" }}
        >
          Go to the New Site Now
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}