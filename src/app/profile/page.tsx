"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { isLoggedIn, logout } = useAuth();
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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm flex flex-col items-center shadow-lg mt-10">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 border-2 border-red-500 overflow-hidden">
          <span className="text-4xl text-gray-400">👤</span>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Admin</h2>
        <p className="text-gray-400 mb-8 text-center">Manage your Tw1sT Official account and preferences.</p>
        
        <button 
          onClick={logout}
          className="w-full p-3 rounded bg-red-600 hover:bg-red-700 text-white font-bold transition-colors active:scale-95"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
