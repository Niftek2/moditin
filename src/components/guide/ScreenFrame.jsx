import React from "react";

export default function ScreenFrame({ url, children }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
      <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-gray-500 font-mono truncate">
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}