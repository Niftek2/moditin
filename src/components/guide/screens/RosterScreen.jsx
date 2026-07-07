import React from "react";
import { RefreshCw, Trash2 } from "lucide-react";

const ACTIVE = [
  { name: "Alex Rivera", email: "a.rivera@yourdistrict.org" },
  { name: "Sam Chen", email: "s.chen@yourdistrict.org" },
];

export default function RosterScreen() {
  return (
    <div className="bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] p-6 space-y-3">
      <div className="bg-white rounded-2xl p-4 shadow-xl">
        <p className="text-sm font-bold text-[#400070] mb-2">Active Teachers (2)</p>
        <ul className="divide-y divide-gray-100">
          {ACTIVE.map((t) => (
            <li key={t.email} className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-gray-800 text-xs">{t.name}</p>
                <p className="text-gray-500 text-[10px]">{t.email}</p>
              </div>
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-800 mb-2">Pending Invitations (1)</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-900 text-xs">Jordan Smith</p>
            <p className="text-blue-600 text-[10px]">jordan.smith@yourdistrict.org</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}