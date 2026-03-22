import React from "react";
import { X } from "lucide-react";

export default function PWAInstallGuideModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/80 rounded-full p-1.5 text-gray-500 hover:text-gray-800 shadow"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <img
          src="https://media.base44.com/images/public/6998a9f042c4eb98ea121183/cff93334d_Gemini_Generated_Image_thc8c3thc8c3thc8.png"
          alt="How to add Modal Itinerant to your iPhone home screen"
          className="w-full rounded-2xl"
        />
      </div>
    </div>
  );
}