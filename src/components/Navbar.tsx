"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, isApproved } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <nav className="fixed bottom-0 w-full h-16 md:h-20 bg-black border-t border-red-600 flex z-50"></nav>;

  const publicNavItems = [
    { name: "Home", path: "/", activeIcon: "/res/home-active.png", inactiveIcon: "/res/home-inactive.png" },
    { name: "Login", path: "/login", activeIcon: "/res/profile-active.png", inactiveIcon: "/res/profile-inactive.png" }
  ];

  const privateNavItems = [
    { name: "Home", path: "/", activeIcon: "/res/home-active.png", inactiveIcon: "/res/home-inactive.png" },
    { name: "Messages", path: "/messages", activeIcon: "/res/notification-active.png", inactiveIcon: "/res/notification-inactive.png" },
    { name: "More", path: "/more", activeIcon: "/res/apps-active.png", inactiveIcon: "/res/apps-inactive.png" }
  ];

  const navItems = (isLoggedIn && isApproved) ? privateNavItems : publicNavItems;

  return (
    <nav className="fixed bottom-0 w-full h-16 md:h-20 bg-black border-t border-red-600 flex z-50 transition-all duration-300">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (pathname.startsWith("/apps") && item.path === "/more");

        return (
          <Link
            key={item.name}
            href={item.path}
            className={`flex-1 flex flex-col justify-center items-center cursor-pointer transition-colors duration-200 ${isActive ? "text-red-500" : "text-gray-500"}`}
          >
            <div className="relative w-6 h-6 md:w-8 md:h-8 mb-1 transition-all duration-300">
              <Image
                src={isActive ? item.activeIcon : item.inactiveIcon}
                alt={item.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 24px, 32px"
              />
            </div>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
