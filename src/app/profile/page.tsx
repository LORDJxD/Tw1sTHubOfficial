"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If we loaded the profile page directly and aren't logged in, redirect
    if (isLoggedIn === false && localStorage.getItem("loggedIn") !== "true") {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm flex flex-col items-center shadow-lg mt-6">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 border-2 border-red-500 overflow-hidden shadow-lg shadow-red-950/30">
          <span className="text-4xl text-gray-300">👤</span>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-white text-center">
            {isAdmin ? "Admin Profile" : "User Profile"}
          </h2>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-800">
              Admin
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-6 text-center font-mono break-all">
          {user?.email || "Tw1sT Hub Member"}
        </p>

        <div className="w-full space-y-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="w-full p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-900/30 text-sm"
            >
              <span>⚙️</span>
              Open Admin Dashboard
            </Link>
          )}

          <button
            onClick={logout}
            className="w-full p-3 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 font-bold transition active:scale-95 text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
