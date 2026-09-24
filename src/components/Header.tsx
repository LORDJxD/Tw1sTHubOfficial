"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="fixed top-0 w-full h-16 md:h-20 bg-black flex items-center justify-center border-b border-red-600 z-50 transition-all duration-300">
      <div className="relative w-32 h-8 md:w-40 md:h-10 transition-all duration-300">
        <Image
          src="/res/logo.png"
          alt="Tw1sT Official Logo"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 128px, 160px"
        />
      </div>
    </header>
  );
}
