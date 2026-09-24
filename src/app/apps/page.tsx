"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const APP_LIST = [
  { id: "rngod", name: "RNGod", href: "/apps/rngod", requiresAuth: true },
  { id: "darklight", name: "DarkLight", href: "/apps/darklight", requiresAuth: true },
  { id: "soon1", name: "Coming Soon", disabled: true },
  { id: "soon2", name: "Coming Soon", disabled: true },
  { id: "soon3", name: "Coming Soon", disabled: true },
  { id: "soon4", name: "Coming Soon", disabled: true },
];

export default function AppsPage() {
  const { isLoggedIn, requireAuth } = useAuth();
  const router = useRouter();
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

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
    }, 300); // Small delay for UX feel
  };

  return (
    <div className="flex-1 p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-6 text-red-500 border-b border-red-900 pb-2">Apps</h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {APP_LIST.map((app) => {
          const isLocked = app.requiresAuth && !isLoggedIn;
          const isDisabled = app.disabled;

          return (
            <div
              key={app.id}
              onClick={() => handleAppClick(app)}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-xl
                bg-gray-900 border border-gray-800 shadow-md text-center transition-all duration-200
                ${isDisabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer hover:bg-gray-800 hover:scale-105 active:scale-95"}
                ${loadingApp === app.id ? "opacity-75 scale-95 animate-pulse" : ""}
              `}
            >
              <div className="w-12 h-12 relative mb-2">
                <Image src="/res/logo.png" alt={app.name} fill className="object-cover rounded-lg" />
              </div>
              <span className="text-xs font-semibold text-gray-300">{app.name}</span>
              
              {isLocked && !isDisabled && (
                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-xl">🔒</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
