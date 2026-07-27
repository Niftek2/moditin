import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

export default function ExportMyDataCard() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("exportMyData", {});
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modal-itinerant-data-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 5000);
    } catch (e) {
      setError("Export failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="modal-card p-6 border-2 border-[#6B2FB9]/30">
      <h3 className="font-semibold text-[var(--modal-text)] mb-2">
        Export My Data — Move to dhhitinerant.com
      </h3>
      <p className="text-xs text-[var(--modal-text-muted)] mb-4">
        This site has moved to{" "}
        <a
          href="https://dhhitinerant.com"
          className="text-[#400070] font-semibold underline"
        >
          dhhitinerant.com
        </a>
        . Download all of your data as a single file, then import it into your
        new account.
      </p>
      <ol className="text-sm text-[var(--modal-text)] space-y-2 mb-4 list-none">
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#400070] text-white text-xs font-bold flex items-center justify-center">1</span>
          Click <span className="font-semibold">Download My Data</span> below and save the file to your device.
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#400070] text-white text-xs font-bold flex items-center justify-center">2</span>
          Go to <span className="font-semibold">dhhitinerant.com</span> and sign in (or create your account with the same email).
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#400070] text-white text-xs font-bold flex items-center justify-center">3</span>
          Open <span className="font-semibold">Settings → Import Data</span> on the new site and upload the file you downloaded.
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#400070] text-white text-xs font-bold flex items-center justify-center">4</span>
          Review your students, sessions, goals, and calendar to confirm everything transferred.
        </li>
      </ol>
      <p className="text-xs text-[var(--modal-text-muted)] mb-4">
        The export includes your students, service entries, goals and progress,
        audiology snapshots, contacts, accommodations, calendar events, mileage,
        equipment, activity plans, reminders, and reports.
      </p>
      {done && (
        <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
          <CheckCircle2 className="w-4 h-4" /> Your data file has been downloaded!
        </div>
      )}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleExport}
          disabled={loading}
          className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? "Preparing your export…" : "Download My Data"}
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open("https://dhhitinerant.com", "_blank")}
          className="border-[var(--modal-border)] text-[#400070] gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open dhhitinerant.com
        </Button>
      </div>
    </div>
  );
}