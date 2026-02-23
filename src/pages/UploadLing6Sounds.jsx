import { useState } from "react";
import { base44 } from "@/api/base44Client";

const SOUNDS = ["m", "oo", "ah", "ee", "sh", "s"];

export default function UploadLing6Sounds() {
  const [uploads, setUploads] = useState({});
  const [loading, setLoading] = useState({});

  const handleUpload = async (sound, file) => {
    setLoading(prev => ({ ...prev, [sound]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploads(prev => ({ ...prev, [sound]: file_url }));
    setLoading(prev => ({ ...prev, [sound]: false }));
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-2">Upload Ling 6 Sound Files</h1>
      <p className="text-gray-500 mb-8">Upload one MP3 per sound. Copy the URLs and share them to update the app.</p>

      <div className="space-y-4">
        {SOUNDS.map(sound => (
          <div key={sound} className="modal-card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg uppercase">{sound}</span>
              <label className="cursor-pointer bg-[#400070] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#6B2FB9] transition-colors">
                {loading[sound] ? "Uploading..." : "Choose MP3"}
                <input
                  type="file"
                  accept="audio/mp3,audio/*"
                  className="hidden"
                  disabled={loading[sound]}
                  onChange={e => e.target.files[0] && handleUpload(sound, e.target.files[0])}
                />
              </label>
            </div>
            {uploads[sound] && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1">✓ Uploaded! Copy this URL:</p>
                <input
                  readOnly
                  value={uploads[sound]}
                  onClick={e => e.target.select()}
                  className="w-full text-xs bg-white border border-green-200 rounded p-2 text-gray-700 cursor-text"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}