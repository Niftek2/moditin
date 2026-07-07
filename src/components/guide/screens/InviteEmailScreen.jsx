import React from "react";

export default function InviteEmailScreen() {
  return (
    <div className="bg-gray-50 p-5">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-[10px] text-gray-400 mb-0.5">From: Modal Itinerant</p>
        <p className="text-xs font-bold text-gray-800 mb-3">Welcome to Modal Itinerant — Your district has added you! 🎉</p>
        <p className="text-[11px] text-gray-600 mb-2">Hi Jordan,</p>
        <p className="text-[11px] text-gray-600 mb-2">
          Your district has purchased a Modal Itinerant license for you. Your account is ready — sign in with
          your school email and the temporary password below, then set your own password.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-md px-3 py-2 mb-3">
          <p className="text-[10px] text-purple-700">Temporary password: <span className="font-mono font-bold">••••••••</span></p>
        </div>
        <div className="bg-[#400070] text-white text-[11px] font-bold text-center rounded-lg py-2 w-40">Sign In to Get Started</div>
      </div>
    </div>
  );
}