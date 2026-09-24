"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

export function NotificationsDropdown() {
  const { isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoggedIn) return null;

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-gray-600 transition"
      >
        <span className="text-xl">🔔</span>
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-red-900 rounded-xl shadow-xl overflow-hidden z-[100]">
          <div className="p-3 border-b border-gray-800 bg-black text-white font-bold text-sm">
            Notifications
          </div>
          <div className="max-h-64 overflow-y-auto">
            <div className="p-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition">
              <h4 className="text-sm font-semibold text-white">Welcome!</h4>
              <p className="text-xs text-gray-400">Your account is pending approval by an admin.</p>
            </div>
            <div className="p-3 hover:bg-gray-800 cursor-pointer transition">
              <h4 className="text-sm font-semibold text-white">Server Maintenance</h4>
              <p className="text-xs text-gray-400">Servers will be down tonight at 8 PM.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
