"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const APP_LIST = [
  { id: "rngod", name: "RNGod", href: "/apps/rngod", requiresAuth: true },
  { id: "darklight", name: "DarkLight", href: "/apps/darklight", requiresAuth: true },
  { id: "soon1", name: "Coming Soon", disabled: true },
  { id: "soon2", name: "Coming Soon", disabled: true },
  { id: "soon3", name: "Coming Soon", disabled: true },
  { id: "soon4", name: "Coming Soon", disabled: true },
];

export default function MorePage() {
  const { isLoggedIn, logout, requireAuth } = useAuth();
  const router = useRouter();
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  useEffect(() => {
    // If not logged in, they shouldn't really see "More" page based on the new nav, but just in case
    if (isLoggedIn === false && localStorage.getItem("loggedIn") !== "true") {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  const handleAppClick = (app: typeof APP_LIST[0]) => {
    if (app.disabled) return;
    
    setLoadingApp(app.id);
    setTimeout(() => {
      if (app.requiresAuth) {
        requireAuth(() => router.push(app.href!));
      } else {
        router.push(app.href!);
      }
      setLoadingApp(null);
    }, 300);
  };

  if (!isLoggedIn) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col max-w-4xl mx-auto w-full">
      {/* Account Section */}
      <section className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-800 rounded-full flex items-center justify-center border-2 border-red-500 flex-shrink-0">
          <span className="text-4xl">👤</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-1">Admin Account</h2>
          <p className="text-sm text-gray-400 mb-4">Manage your Tw1sT Official profile and settings.</p>
          <button 
            onClick={logout}
            className="w-full md:w-auto px-6 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold transition-colors active:scale-95 text-sm md:text-base"
          >
            Logout
          </button>
        </div>
      </section>

      {/* Apps Section */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-red-500 border-b border-red-900 pb-2">Apps & Games</h2>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {APP_LIST.map((app) => {
            const isLocked = app.requiresAuth && !isLoggedIn;
            const isDisabled = app.disabled;

            return (
              <div
                key={app.id}
                onClick={() => handleAppClick(app)}
                className={`
                  relative flex flex-col items-center justify-center p-3 md:p-4 rounded-xl
                  bg-gray-900 border border-gray-800 shadow-md text-center transition-all duration-200
                  ${isDisabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer hover:bg-gray-800 hover:scale-105 active:scale-95"}
                  ${loadingApp === app.id ? "opacity-75 scale-95 animate-pulse" : ""}
                `}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 relative mb-2 transition-all duration-200">
                  <Image src="/res/logo.png" alt={app.name} fill className="object-cover rounded-lg" sizes="56px" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-300 leading-tight">{app.name}</span>
                
                {isLocked && !isDisabled && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-xl md:text-2xl">🔒</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
