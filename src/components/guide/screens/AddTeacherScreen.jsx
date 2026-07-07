import React from "react";
import { UserPlus, Check } from "lucide-react";

export default function AddTeacherScreen() {
  return (
    <div className="bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] p-6">
      <div className="bg-white rounded-2xl p-4 shadow-xl">
        <p className="text-sm font-bold text-[#400070] mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add a Teacher
        </p>
        <div className="space-y-2">
          <div className="border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700">Jordan Smith</div>
          <div className="border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700">jordan.smith@yourdistrict.org</div>
          <p className="text-green-600 text-[11px] flex items-center gap-1">
            <Check className="w-3 h-3" /> Teacher invited! They'll receive a welcome email with their temporary password.
          </p>
          <div className="bg-[#400070] text-white text-xs font-bold text-center rounded-xl py-2.5">Invite Teacher</div>
        </div>
      </div>
    </div>
  );
}